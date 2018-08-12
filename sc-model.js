import SCField from './sc-field.js';

// options.socket: The SocketCluster client socket to use to sync the model state.
// options.type:
// options.id:
// options.fields:
function SCModel(options) {
  this.socket = options.socket;
  this.type = options.type;
  this.id = options.id;
  this.fields = options.fields;

  this.fields.forEach(() => {

  });
}

SCModel.prototype.getChannelName = function (field) {
  return 'crud>' + this.type + '/' + this.id + '/' + field;
};

export default SCModel;
