// Base class for demo pages

const Demo = (function() {
  'use strict';
  console.log('hey from demo')
  const C1 = TreeChart.config1;

  class Demo {
    constructor() {
      // Give this a unique id
      this.id = TreeChart.nextId;


    }
  };

  return Demo;
})();
