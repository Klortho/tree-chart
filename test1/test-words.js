'use strict';

(function () {
  'use strict';

  // chai assertion reference: http://chaijs.com/api/assert/
  const assert = chai.assert;

  describe('WordList', function() {

    it('random number generator works', function() {
      const min = 20;
      const max = 50;
      var randoms = WordList.random(min, max);
      var record = [];

      for (var i = 0; i < max - min; ++i) record[i] = 0;
      for (i = 0; i < 100000; ++i) {
        var sample = randoms.next().value;
        assert(sample >= min && sample <= max);
        record[sample - min]++;
      }
      record.forEach(n => assert(n > 0));
    });

    it('pick should pick a random member of a list', function() {
      var picker = WordList.pick([1, 2, 4, 8]);
      var mask = 0;
      for (var i = 1000; i; --i) {
        const pick = picker.next().value;
        assert(pick | 15 != 0);
        mask |= pick;
      }
      assert.equal(mask, 15);
    });

  });

/*
  describe('words', function() {
    it('Should get the word list', function (done) {
      const wordList = new WordList();
      assert(wordList instanceof WordList);

      return wordList.words.then(function(words) {
        assert(words.length > 100000);
      });
    });

*/

/*
  describe('wordGenerator', function() {

    it('picks random words', function() {
      const wordGenerator = WordList.wordGenerator();
      for (var i = 0; i < 100; ++i) {
        console.log(wordGenerator.next().value);
      }
    })
  });

/ *

*/


})();

