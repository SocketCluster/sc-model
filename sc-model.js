import SCField from './sc-field.js';
const Emitter = SCField.Emitter;

// options.socket: The SocketCluster client socket to use to sync the model state.
// options.type:
// options.id:
// options.fields:
function SCModel(options) {
  this.socket = options.socket;
  this.type = options.type;
  this.id = options.id;
  this.fields = options.fields;
  this.scFields = [];

  this._handleSCFieldError = (err) => {
    this.emit('error', err);
  };

  this.fields.forEach((field) => {
    let scField = new SCField({
      socket: this.socket,
      resourceType: this.type,
      resourceId: this.id,
      name: field
    });
    scField.on('error', this._handleSCFieldError);
    this.scFields.push(scField);
  });
}

SCModel.prototype = Object.create(Emitter.prototype);

SCModel.prototype.destroy = function () {
  this.scFields.forEach((scField) => {
    scField.removeListener('error', this._handleSCFieldError);
    scField.destroy();
  });
};

export default SCModel;
