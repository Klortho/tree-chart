// Set up the word list

fetch('node_modules/word-list-json/words.json')
.then(response => {
  if (response.status !== 200) {
    console.error('Problem fetching word list');
    return;
  }
  return response.json();
})
.then(wordsJson => {
  TreeChart.WordList = wordsJson.words;
  treeDemo();
})
.catch(err => {
  console.error('Error while fetching word list: ', err);
});


function treeDemo() {
    console.log('Number of words: ' + TreeChart.Words.length);

}