const stringifyPair = (master, slave) => {
  let masterString = '';
  let slaveString = '';
  if ('string' === typeof master){
    return {
      master: master.slice(),
      slave: stringify(slave)
    };
  }
  if (Array.isArray(master) && Array.isArray(slave)){

    for(let i=0;i<master.length && i < slave.length; i++) {
      stringifyPair(master[i], slave[i]);
    }
  }
};

const stringify = item => {
  let string = '';
  if('string' === typeof item) return item.slice();

};

module.exports = {
  stringify,
  stringifyPair
};
