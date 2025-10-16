const Pokemon = require('../models/Pokemon')
const User = require('../models/User')

// GET /api/pokemon
exports.getAll = async (req, res) => {
  try {
    const pokemon = await Pokemon.find({})
    res.json({ pokemon })
  } catch (err) {
    console.error('getAll pokemon error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/pokemon/claim
// body: { pokemonId }
// protected route
exports.claim = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId) return res.status(400).json({ message: 'pokemonId required' })

    const pokemon = await Pokemon.findById(pokemonId)
    if (!pokemon) return res.status(404).json({ message: 'Pokemon not found' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // If user already has this pokemon, return conflict
    const already = user.pokemon.find(p => String(p.pokemonId) === String(pokemon._id))
    if (already) return res.status(409).json({ message: 'User already has this Pokémon' })

    // Add pokemon to user's collection
    user.pokemon.push({ pokemonId: pokemon._id, level: 1 })
    await user.save()

    // return populated user object
    const populated = await User.findById(user._id).populate('pokemon.pokemonId')
    res.json({ user: populated })
  } catch (err) {
    console.error('claim pokemon error', err)
    res.status(500).json({ message: 'Server error' })
  }
}
