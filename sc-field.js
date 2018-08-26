import jsonStableStringify from '/node_modules/sc-json-stable-stringify/sc-json-stable-stringify.js';
import socketClusterClient from '/node_modules/socketcluster-client-edge/socketcluster.js';
const Emitter = socketClusterClient.Emitter;

function SCField(options) {
  Emitter.call(this);

  this.socket = options.socket;
  this.resourceType = options.resourceType;
  this.resourceId = options.resourceId;
  this.name = options.name;
  this.active = true;

  this.resourceChannelName = 'crud>' + this.resourceType + '/' + this.resourceId + '/' + this.name;
  this.channel = this.socket.subscribe(this.resourceChannelName);

  this._handleChannelData = (packet) => {
    if (packet == null) {
      this.loadData();
    } else {
      let oldValue = this.value;
      if (packet.type === 'delete') {
        this.value = null;
        this.destroy();
      } else {
        this.value = packet.value;
      }
      this.loadedValue = this.value;
      this._triggerValueChange(oldValue, this.value);
    }
  };

  this.channel.watch(this._handleChannelData);

  // Fetch data once the subscribe is successful.
  this.channel.on('subscribe', () => {
    this.loadData();
  });
  if (this.channel.state === 'subscribed') {
    this.loadData();
  }
  this.socket.on('authenticate', this.resubscribe);
}

SCField.prototype = Object.create(Emitter.prototype);

SCField.Emitter = Emitter;

SCField.prototype._triggerValueChange = function (oldValue, newValue) {
  this.emit('change', {
    field: this.name,
    oldValue: oldValue,
    newValue: newValue
  });
};

SCField.prototype.loadData = function () {
  let query = {
    type: this.resourceType,
    id: this.resourceId,
    field: this.name
  };
  this.socket.emit('read', query, (err, result) => {
    if (err) {
      this.emit('error', err);
    } else {
      let oldValue = this.value;
      this.value = result;
      this.loadedValue = result;
      this._triggerValueChange(oldValue, this.value);
    }
  });
};

SCField.prototype.resubscribe = function () {
  this.socket.subscribe(this.resourceChannelName);
};

SCField.prototype.save = function () {
  if (this.value === this.loadedValue) {
    return Promise.resolve(this.value);
  }
  return this.update(this.value);
};

SCField.prototype.update = function (newValue) {
  let oldValue = this.value;
  this.value = newValue;
  this._triggerValueChange(oldValue, this.value);
  let query = {
    type: this.resourceType,
    id: this.resourceId,
    field: this.name,
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

SCField.prototype.delete = function () {
  let oldValue = this.value;
  this.value = null;
  this._triggerValueChange(oldValue, this.value);
  let query = {
    type: this.resourceType,
    id: this.resourceId,
    field: this.name
  };
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

SCField.prototype.destroy = function () {
  if (!this.active) {
    return;
  }
  this.active = false;
  this.socket.off('authenticate', this.resubscribe);
  this.channel.unwatch(this._handleChannelData);
  if (!this.channel.watchers().length) {
    this.channel.destroy();
  }
};

export default SCField;
