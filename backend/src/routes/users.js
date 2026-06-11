const express = require('express');
const router = express.Router();
const service = require('../services/users.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);

// --- me ---
router.get('/me', async (req, res, next) => {
  try { res.json(await service.getMe(req.auth_user.user_id)); }
  catch (err) { next(err); }
});

router.put('/me', async (req, res, next) => {
  try { res.json(await service.updateMe(req.auth_user.user_id, req.body)); }
  catch (err) { next(err); }
});

router.delete('/me', async (req, res, next) => {
  try { res.status(204).send(await service.deleteMe(req.auth_user.user_id)); }
  catch (err) { next(err); }
});

// --- user by id ---
router.get('/:id', async (req, res, next) => {
  try { res.json(await service.getMe(req.params.id)); }
  catch (err) { next(err); }
});

// --- favorites ---
router.get('/me/favorites', async (req, res, next) => {
  try { res.json(await service.getFavorites(req.auth_user.user_id, req.query.limit, req.query.offset)); }
  catch (err) { next(err); }
});

router.post('/me/favorites/:id', async (req, res, next) => {
  try { res.status(201).json(await service.addFavorite(req.auth_user.user_id, req.params.id)); }
  catch (err) { next(err); }
});

router.delete('/me/favorites/:id', async (req, res, next) => {
  try { res.status(204).send(await service.removeFavorite(req.auth_user.user_id, req.params.id)); }
  catch (err) { next(err); }
});

// --- library ---
router.get('/me/library', async (req, res, next) => {
  try { res.json(await service.getLibrary(req.auth_user.user_id, req.query.limit, req.query.offset)); }
  catch (err) { next(err); }
});

router.post('/me/library/:id', async (req, res, next) => {
  try { res.status(201).json(await service.addToLibrary(req.auth_user.user_id, req.params.id)); }
  catch (err) { next(err); }
});

router.delete('/me/library/:id', async (req, res, next) => {
  try { res.status(204).send(await service.removeFromLibrary(req.auth_user.user_id, req.params.id)); }
  catch (err) { next(err); }
});

// --- sessions ---
router.get('/me/sessions', async (req, res, next) => {
  try { res.json(await service.getSessions(req.auth_user.user_id)); }
  catch (err) { next(err); }
});

router.delete('/me/sessions/:id', async (req, res, next) => {
  try { res.status(204).send(await service.revokeSession(req.auth_user.user_id, req.params.id)); }
  catch (err) { next(err); }
});

router.delete('/me/sessions', async (req, res, next) => {
  try { res.status(204).send(await service.revokeAllSessions(req.auth_user.user_id)); }
  catch (err) { next(err); }
});

module.exports = router;