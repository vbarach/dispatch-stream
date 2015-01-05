var Writable = require('stream').Writable;
var util = require('util');

module.exports = DispatchStream;

function DispatchStream(typeGetter, options){
    if(!(this instanceof DispatchStream)) return new DispatchStream(typeGetter, options);
    if(!typeGetter) throw new Error('Expected a string or a function as first arg instead got : ' + typeGetter.toString());

    options || (options = {});
    options.objectMode = true;

    Writable.call(this, options);

    this._typeGetter = typeof typeGetter === 'string' ? _propGetter(typeGetter) : typeGetter;
    this._isAsync = this._typeGetter.length === 2;
    this._streams = {};
}

util.inherits(DispatchStream, Writable);

DispatchStream.prototype.register = function(type, stream){
    this._streams[type] = stream;
    return this;
};

DispatchStream.prototype._write = function(message, encoding, callback){
    var _this = this;
    if(this._isAsync){
        return this._typeGetter(message, function(err, type){
            if(err) return callback(err);
            return _this.doWrite(type, message, callback);
        });
    } else {
        var typeOrError = _tryGet(this._typeGetter, message);
        if(typeOrError instanceof Error) return callback(typeOrError);
        return _this.doWrite(typeOrError, message, callback);
    }
};

DispatchStream.prototype.doWrite = function(type, message, callback){
    var stream = this._streams[type];
    if(!stream) return callback(new Error('No stream found for type : ' + type));

    var method = (stream.write || stream.push);
    if(!method) return callback(new Error('object is not a stream'));

    method.call(stream, message);
    return callback();
};

function _propGetter(typeProp){
    return function(message){
        return message[typeProp];
    };
}

function _tryGet(fn, message){
    try {
        return fn(message);
    } catch(err){
        err.message = 'Error in typeGetter function : ' + err.message;
        return err;
    }
}