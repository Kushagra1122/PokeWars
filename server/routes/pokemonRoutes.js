const express = require('express')
const router = express.Router()
const pokemonController = require('../controllers/pokemonController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/pokemon', pokemonController.getAll)
router.post('/pokemon/claim', authMiddleware, pokemonController.claim)

module.exports = router
