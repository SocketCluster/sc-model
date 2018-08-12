import jsonStableStringify from '/node_modules/sc-json-stable-stringify/sc-json-stable-stringify.js';
import socketClusterClient from '/node_modules/socketcluster-client-edge/socketcluster.js';
const Emitter = socketClusterClient.Emitter;

function SCField(options) {
  Emitter.call(this);

  this.socket = options.socket;
  this.resourceType = options.type;
  this.resourceId = options.id;
  this.name = options.name;

  this.resourceChannelName = 'crud>' + this.resourceType + '/' + this.resourceId + '/' + this.name;
  this.channel = this.socket.subscribe(this.resourceChannelName);
  this.channel.watch(this.watcher);

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

SCField.prototype.loadData = function () {
  var query = {
    type: this.resourceType,
    id: this.resourceId,
    field: this.name
  };
  this.socket.emit('read', query, (err, result) => {
    if (err) {
      this.emit('error', err);
    } else {
      this.value = result;
      this.loadedValue = result;
    }
  });
};

SCField.prototype.watcher = function () {
  if (packet == null) {
    this.loadData();
  } else {
    if (packet.type === 'delete') {
      this.value = null;
      this.destroy();
    } else {
      this.value = packet.value;
    }
    this.loadedValue = this.value;
  }
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
  this.value = newValue;
  var query = {
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

SCField.prototype.delete = function (callback) {
  this.value = null;
  var query = {
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
  this.socket.off('authenticate', this.resubscribe);
  this.channel.unwatch(this.watcher);
  if (!this.channel.watchers().length) {
    this.channel.destroy();
  }
};

export default SCField;
