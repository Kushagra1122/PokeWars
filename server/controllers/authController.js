const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('../models/Pokemon'); // register Pokemon for populate

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.signup = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ message: 'Name and password required' });

    const existing = await User.findOne({ name });
    if (existing)
      return res.status(409).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, passwordHash });

    await user.save();

    // Populate pokemon if any
    const userObj = await User.findById(user._id).populate('pokemon.pokemonId');

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ message: 'Name and password required' });

    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });
    const userObj = await User.findById(user._id).populate('pokemon.pokemonId');
    res.json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    // Find user by ID, exclude password field, and populate Pokémon details
    const user = await User.findById(req.user.id)
      .select('-password') // exclude password
      .populate('pokemon.pokemonId') // populate Pokémon reference
      .populate('pokemon.level');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('❌ Error in /me route:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Link wallet to existing authenticated user
exports.linkWallet = async (req, res) => {
  try {
    const { address, basename } = req.body;
    const userId = req.user.id;

    if (!address) {
      return res.status(400).json({ message: 'Address required' });
    }

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Check if address is already linked to another user
    const existingUser = await User.findOne({ address: normalizedAddress });
    if (existingUser && String(existingUser._id) !== String(userId)) {
      return res
        .status(409)
        .json({ message: 'Wallet already linked to another account' });
    }

    // Update user with wallet info
    const user = await User.findByIdAndUpdate(
      userId,
      {
        address: normalizedAddress,
        basename: basename || null,
      },
      { new: true },
    ).populate('pokemon.pokemonId');

    console.log(`✅ Wallet linked to user ${user.name}: ${normalizedAddress}`);
    res.json({ user, message: 'Wallet linked successfully' });
  } catch (err) {
    console.error('❌ Error linking wallet:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or get user by wallet address (for wallet-only users)
exports.createWalletUser = async (req, res) => {
  try {
    const { address, basename } = req.body;

    if (!address) {
      return res.status(400).json({ message: 'Address required' });
    }

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Check if user already exists with this address
    let user = await User.findOne({ address: normalizedAddress }).populate(
      'pokemon.pokemonId',
    );

    if (user) {
      // Update basename if provided and different
      if (basename && user.basename !== basename) {
        user.basename = basename;
        await user.save();
      }
      console.log(`✅ Wallet user already exists: ${normalizedAddress}`);
      return res.json({ user, message: 'Wallet user found' });
    }

    // Create new wallet-only user (no password required)
    // Use address as username initially
    const username =
      basename || `${address.slice(0, 6)}...${address.slice(-4)}`;
    const tempPassword = Math.random().toString(36).slice(-16); // Random password they won't use
    const passwordHash = await require('bcrypt').hash(tempPassword, 10);

    user = new User({
      name: username,
      passwordHash,
      address: normalizedAddress,
      basename: basename || null,
      pokemon: [],
    });

    await user.save();
    const userObj = await User.findById(user._id).populate('pokemon.pokemonId');

    console.log(`✅ New wallet user created: ${normalizedAddress}`);
    res.json({ user: userObj, message: 'Wallet user created' });
  } catch (err) {
    console.error('❌ Error creating wallet user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
