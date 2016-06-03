// Base class for demo pages

const Demo = (function() {
  'use strict';
  console.log('hey from demo')
  const C1 = TreeChart.config1;


  const list = [];



  class Demo {
    constructor() {
      // Give this a unique id
      this.id = TreeChart.nextId;

      // Keep a list of all the demos
      Demo.list.push(this);

    }
  };

  Demo.list = list;



  return Demo;
})();
