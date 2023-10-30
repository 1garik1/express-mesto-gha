const Cards = require('../models/card');
const BadRequest = require('../errors/BadRequest');
const NotFoundError = require('../errors/NotFoundError');

const ForbiddenError = require('../errors/ForbiddenError');

const getCards = (req, res, next) => {
  Cards.find({})
    .then((cards) => res.status(200).send(cards))
    .catch(next);
};

const createCard = (req, res, next) => {
  const { name, link } = req.body;
  const owner = req.user._id;

  return Cards.create({ name, link, owner })
    .then((card) => res.status(200).send(card))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequest('Переданы некорректные данные при создании карточки'));
      }

      return next(err);
    });
};

const deleteCard = (req, res, next) => {
  const { id: cardId } = req.params;
  const { userId } = req.user;

  Cards
    .findById({
      _id: cardId,
    })
    .then((card) => {
      if (!card) throw new NotFoundError('Данные по указанному id не найдены');

      const { owner: cardOwnerId } = card;
      if (cardOwnerId.valueOf() !== userId) throw new ForbiddenError('Нет прав доступа');

      card
        .remove()
        .then(() => res.send({ data: card }))
        .catch(next);
    })
    .catch(next);
};

/* throw new NotFound('Карточка с указанным _id не найдена');
})
.then((card) => {
  if (card.owner.toString() === req.user._id) {
    Cards.findByIdAndRemove(cardId).then(() => res.status(200).send(card));
  } else {
    throw new ForbiddenError('В доступе отказано');
  }
})
.catch(next);
}; */

const likeCard = (req, res, next) => {
  Cards.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  ).orFail(() => {
    throw new NotFound('Передан несуществующий _id карточки');
  })
    .then((card) => res.status(200).send(card))
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest('Переданы некорректные данные для постановки лайка'));
      }
      if (err.message === 'NotFound') {
        next(new NotFound('Передан несуществующий _id карточки'));
      }
      next(err);
    });
};

const dislikeCard = (req, res, next) => {
  Cards.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  ).orFail(() => {
    throw new NotFound('Передан несуществующий _id карточки');
  })
    .then((card) => res.status(200).send(card))
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest('Переданы некорректные данные для снятия лайка'));
      }
      if (err.message === 'NotFound') {
        next(new NotFound('Передан несуществующий _id карточки'));
      }
      next(err);
    });
};

module.exports = {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
