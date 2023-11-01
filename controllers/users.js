const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const BadRequest = require('../errors/BadRequest');
const ConflictError = require('../errors/ConflictError');
// const AuthError = require('../errors/AuthError');
const { ValidationError } = mongoose.Error;
const getUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.status(200).send(users))
    .catch(next);
};

const getUser = (req, res, next) => {
  User.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь по указанному _id не найден');
      }
      res.send({ data: user });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return next(new BadRequest('Переданы некорректные данные'));
      }

      return next(err);
    });
};

const createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  const passwordHash = bcrypt.hash(password, 10);
  passwordHash.then((hash) => User.create({
    name, about, avatar, email, password: hash,
  }))
    // Не передаём пароль в ответе
    .then(() => res.status(201).send({
      name, about, avatar, email,
    }))
    .catch((error) => {
      if (error instanceof ValidationError) {
        next(new BadRequest('Переданы некорректные данные при создании пользователя'));
      } else if (error.code === 11000) {
        next(new ConflictError('Пользователь c указанной почтой уже есть в системе'));
      } else { next(error); }
    });
};

/* const {
  name, about, avatar, email,
} = req.body;
bcrypt.hash(req.body.password, 10)
 .then((hash) => {
    User.create({
      name, about, avatar, email, password: hash,
    });
  })
  .then((user) => res.status(201).send(user))
  .catch((err) => {
   / if (err.name === 'ValidationError') {
      next(new BadRequest('Переданы некорректные данные при создании пользователя'));
    } else if (err.code === 11000) {
      next(new ConflictError('Пользователь с таким email уже существует'));
    } else if (err.status(404)) {
      next(new NotFoundError('Пользователь не найден'));
    }
    return next(err);
  });
}; */

const updateProfile = (req, res, next) => {
  const { name, about } = req.body;

  return User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    { new: true, runValidators: true },
  ).orFail(() => {
    next(new NotFoundError('Пользователь с указанным _id не найден'));
  })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequest('Переданы некорректные данные при обновлении профиля'));
      }
      return next(err);
    });
};

const updateAvatar = (req, res, next) => {
  const { avatar } = req.body;

  return User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    { new: true, runValidators: true },
  ).orFail(() => {
    next(new NotFoundError('Пользователь с указанным _id не найден'));
  })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequest('Переданы некорректные данные при обновлении аватара'));
      }
      else { next(err); }
    });
};

const getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => res.status(200).send({ user }))
    .catch((err) => {
      if (res.status(404)) {
        next(new NotFoundError('Пользователь не найден'));
      }
      return next(err);
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((selectedUser) => {
      const userToken = jwt.sign({ _id: selectedUser._id }, 'yandex-praktikum', { expiresIn: '7d' });
      res.send({ userToken });
    })
    .catch((error) => next(error));
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateProfile,
  updateAvatar,
  getCurrentUser,
  login,
};