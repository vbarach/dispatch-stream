var DispatchStream = require('..');
var Through = require('stream').PassThrough;
var expect = require('chai').expect;

describe('#DispatchStream', function(){
    it('should create a new instance of DispatchStream', function(){
        expect(new DispatchStream('type')).to.exist;
    });

    it('should throw an error without typeGetter', function(){
        expect(function(){
            new DispatchStream();
        }).to.throw(Error);
    });

    it('should register a type', function(){
        var dispatchStream = new DispatchStream('type');
        var throughStream = createThrough();
        expect(function(){
            dispatchStream.register('type', throughStream);
        }).to.not.throw(Error);
        expect(dispatchStream._streams['type']).to.exist;
    });

    it('should allow chaining register calls', function(){
        var dispatchStream = new DispatchStream('type');

        expect(function(){
            dispatchStream
                .register('type1', createThrough())
                .register('type2', createThrough())
                .register('type3', createThrough())
        }).to.not.throw(Error);
    });

    it('should dispatch the message', function(done){
        var dispatchStream = new DispatchStream('type');
        var throughStream1 = createThrough();
        var throughStream2 = createThrough();
        var message = {type: 'type2'};

        dispatchStream
            .register('type1', throughStream1)
            .register('type2', throughStream2);

        dispatchStream.write(message);

        throughStream2.on('data', done.bind(null, null));
    });

    it('should handle typeGetter function', function(done){
        var dispatchStream = new DispatchStream(typeGetter);
        var throughStream1 = createThrough();
        var throughStream2 = createThrough();
        var message = {type: 'type1', nested: {type: 'type2'}};

        dispatchStream
            .register('type1', throughStream1)
            .register('type2', throughStream2);

        dispatchStream.write(message);

        throughStream2.on('data', done.bind(null, null));

        function typeGetter(message){
            return message.nested.type;
        }
    });

    it('should emit an error if there is not matching stream', function(done){
        var dispatchStream = new DispatchStream('type');
        var throughStream1 = createThrough();
        var throughStream2 = createThrough();
        var message = {type: 'type3'};

        dispatchStream.on('error', done.bind(null, null));
        dispatchStream
            .register('type1', throughStream1)
            .register('type2', throughStream2);

        dispatchStream.write(message);
    });

    it('should emit an error if typeGetter function throws an error', function(done){
        var dispatchStream = new DispatchStream(typeGetter);
        var throughStream1 = createThrough();
        var throughStream2 = createThrough();
        var message = {type: 'type1', nested: {type: 'type2'}};

        dispatchStream.on('error', done.bind(null, null));

        dispatchStream
            .register('type1', throughStream1)
            .register('type2', throughStream2);

        dispatchStream.write(message);

        function typeGetter(message){
            return message.nested.nonexistent.type;
        }
    });
});


function createThrough(){
    return new Through({objectMode: true});
}