import SCField from './sc-field.js';
const Emitter = SCField.Emitter;

// options.socket: The SocketCluster client socket to use to sync the model state.
// options.type: The resource type.
// options.id: The resource id.
// options.fields: An array of fields names required by this model.
function SCModel(options) {
  Emitter.call(this);

  this.socket = options.socket;
  this.type = options.type;
  this.id = options.id;
  this.fields = options.fields;
  this.scFields = {};
  this.value = {
    id: this.id
  };

  this._handleSCFieldError = (err) => {
    this.emit('error', err);
  };

  this._handleSCFieldChange = (event) => {
    this.value[event.field] = event.newValue;
    this.emit('change', {
      resourceType: this.type,
      resourceId: this.id,
      resourceField: event.field,
      oldValue: event.oldValue,
      newValue: event.newValue
    });
  };

  this.fields.forEach((field) => {
    let scField = new SCField({
      socket: this.socket,
      resourceType: this.type,
      resourceId: this.id,
      name: field
    });
    scField.on('error', this._handleSCFieldError);
    scField.on('change', this._handleSCFieldChange);
    this.scFields[field] = scField;
  });
}

SCModel.prototype = Object.create(Emitter.prototype);

SCModel.Emitter = Emitter;

SCModel.prototype.save = function () {
  let promises = [];
  Object.values(this.scFields).forEach((scField) => {
    promises.push(scField.save());
  });
  return Promise.all(promises);
};

SCModel.prototype.update = function (field, newValue) {
  if (this.scFields[field]) {
    return this.scFields[field].update(newValue);
  }
  let query = {
    type: this.type,
    id: this.id,
    field: field,
    value: newValue
  };
  return new Promise((resolve, reject) => {
    this.socket.emit('update', query, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

SCModel.prototype.delete = function (field) {
  let query = {
    type: this.type,
    id: this.id
  };
  if (field != null) {
    if (this.scFields[field]) {
      return this.scFields[field].delete();
    }
    query.field = field;
  }
  return new Promise((resolve, reject) => {
    this.socket.emit('delete', query, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

SCModel.prototype.destroy = function () {
  Object.values(this.scFields).forEach((scField) => {
    scField.removeListener('error', this._handleSCFieldError);
    scField.removeListener('change', this._handleSCFieldChange);
    scField.destroy();
  });
};

export default SCModel;
