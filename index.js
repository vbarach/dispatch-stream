var Writable = require('stream').Writable;
var util = require('util');

module.exports = DispatchStream;

function DispatchStream(typeGetter, options){
    if(!(this instanceof DispatchStream)) return new DispatchStream(type, options);
    if(!typeGetter) throw new Error('Expected a string or a function as first arg instead got : ' + typeGetter.toString());

    options || (options = {});
    options.objectMode = true;
    Writable.call(this, options);

    this._typeGetter = typeof typeGetter === 'string' ? _propGetter(typeGetter) : typeGetter;
    this._streams = {};
}

util.inherits(DispatchStream, Writable);

DispatchStream.prototype.register = function(type, stream){
    this._streams[type] = stream;
    return this;
};

DispatchStream.prototype._write = function(message, encoding, callback){
    try {
        var type = this._typeGetter(message);
    } catch(err){
        return process.nextTick(callback.bind(null, err));
    }

    var stream = this._streams[type];

    if(!stream) return callback(new Error('No stream found for type : ' + type));

    stream.push.call(stream, message);
    return process.nextTick(callback);
};

function _propGetter(type){
    return function(message){
        return message[type];
    };
}