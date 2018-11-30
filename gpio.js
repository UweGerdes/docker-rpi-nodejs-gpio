const ipc = require('node-ipc');

ipc.config.id = 'gpio';
ipc.config.retry= 1500;

ipc.serve(
    function(){
        ipc.server.on(
            'app.message',
            function(data,socket){
                ipc.server.emit(
                    socket,
                    'app.message',
                    {
                        id      : ipc.config.id,
                        message : data.message+' received!'
                    }
                );
            }
        );
    }
);

ipc.server.start();
