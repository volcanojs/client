/**
 * Converting an Array of Objects to an Object
 * @reference https://medium.com/dailyjs/rewriting-javascript-converting-an-array-of-objects-to-an-object-ec579cafbfc7
 * @param {*} array 
 * @param {*} keyField 
 */
export const arrayToObject = (array, keyField = '_id') => array.reduce((obj, item) => { obj[item[keyField]] = item; return obj}, {})
