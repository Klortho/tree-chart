'use strict';

// NOT USED!
// FOR NOW, IT SEEMS SUPPORT FOR GENERATORS IS POOR.

// So, I'm going to shelve these implementations for now, and write
// some quick-and-dirty functions that provide the same basic functionality,
// if the need arises.

/*
(function () {
  'use strict';

  // chai assertion reference: http://chaijs.com/api/assert/
  const assert = chai.assert;

  describe('Utils', function() {

    it('range', function() {
      const nums = Utils.range(10);
      assert.equal(nums.next().value, 0);

      // Since we used the first item above, this starts with one
      assert.deepEqual([...nums], [1, 2, 3, 4, 5, 6, 7, 8, 9]);

      const result = [...Utils.range(7, 1, 2)];
      assert.deepEqual(result, [1, 3, 5]);
    });

    it('idGenerator', function() {
      const idGen = Utils.idGenerator();
      assert.equal(idGen(), 1);
    });
  });
})();
*/
