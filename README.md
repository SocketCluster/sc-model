# SCModel
SocketCluster real-time model component for reactive front ends.
Designed to work with `sc-crud-rethink` https://github.com/SocketCluster/sc-crud-rethink

## Setup

Inside the directory from which front end files are served, run the command:

```bash
npm install sc-model --save
```

You can import it in your scripts like this (example; your exact path may differ):
```js
import SCModel from '/node_modules/sc-model/sc-model.js';
```

## Usage

See https://github.com/socketcluster/sc-sample-inventory for sample app which demonstrates this component in action.

An SCModel object can be instantiated like this:

```js
this.productModel = new SCModel({
  // Pass the SocketCluster socket object.
  socket: pageOptions.socket,
  type: 'Product',
  id: this.productId,
  fields: ['name', 'qty', 'price', 'desc']
});
```

The SCModel allows you to read and manipulate a single documents in RethinkDB from the front end.
The ```productModel.value``` property is a `Product` object; this object updates in real-time to match the associated resource on the server.

If using a reactive front end framework like VueJS, you can bind the ```productModel.value``` property directly to your template since the object reference never changes (only the internal properties change).

In VueJS, you can instantiate and attach the model value to your component like this:

```js
data: function () {
  this.productModel = new SCModel({
    socket: pageOptions.socket,
    type: 'Product',
    id: this.productId,
    fields: ['name', 'qty', 'price', 'desc']
  });

  return {
    product: this.productModel.value
  };
},
```

Then you can bind this data to your template like this:

```html
// Render available properties of the product.
<b>{{product.id}}</b>
<b>{{product.name}}</b>
<b>{{product.qty}}</b>
<b>{{product.price}}</b>
<b>{{product.desc}}</b>
```

## Supported attributes

The SCModel tag supports the following attributes:

- ```socket```: A ```socketcluster-client``` socket; note that the same global socket object can be shared between multiple SCCollection and SCModel instances.
- ```type```: This is the model/table name in RethinkDB.
- ```id```: The id of the resource/document which this model represents.
- ```fields```: The document fields to load for this model.
