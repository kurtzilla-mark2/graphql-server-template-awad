import _ from 'lodash';
import sequelize from 'sequelize';

// DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>
export const batchSuggestions = async (keys, { Suggestion }) => {
  // keys = [1, 2, 3,...] - board Ids
  // raw returns raw data - not a sql'izd obj
  const suggestions = await Suggestion.findAll({
    //group: ['id'],
    raw: true,
    where: {
      boardId: {
        // sequelized in operator
        $in: keys
      }
    }
  });

  const groupResults = _.groupBy(suggestions, 'boardId');
  // console.log('GROUP RESULTS', groupResults);
  // // GROUP RESULTS { '1': [
  // // { id: 1, text: 'some ne', createdAt: 2017-09-24T21:08:13.307Z, updatedAt: 2017-09-24T21:08:13.307Z, creatorId: 1, boardId: 1 },
  // // { id: 2, text: 'some one', createdAt: 2017-09-24T21:08:13.325Z, updatedAt: 2017-09-24T21:08:13.325Z, creatorId: 1, boardId: 1 },
  // // ...], ...}

  // mapped requires an iterable - hence the extra groupResults step
  const mapped = keys.map(k => groupResults[k] || []);
  // console.log('MAPPED', mapped);
  // // MAPPED [ [
  // // { id: 1, text: 'some ne', createdAt: 2017-09-24T21:08:13.307Z, updatedAt: 2017-09-24T21:08:13.307Z, creatorId: 1, boardId: 1 },
  // // { id: 2, text: 'some one', createdAt: 2017-09-24T21:08:13.325Z, updatedAt: 2017-09-24T21:08:13.325Z, creatorId: 1, boardId: 1 },
  // // ... ] ]

  // transform suggestion results and add empty entries for keys that may not have boards
  return mapped;
};
