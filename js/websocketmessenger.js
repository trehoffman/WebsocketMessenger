function WebsocketMessenger(options) {
    var me = this;
    me.CONNECTION_STRING;
    me.websocket;
	me.elements = {
        input: document.querySelector('input.connection-string'),
        datalist: document.querySelector('#connectionstringhistory'),
		button: document.querySelector('button.open'),
        log: document.querySelector('.log'),
        message: document.querySelector(".message"),
        send: document.querySelector('button.send')
    };
    me.connection_string_history = [];
    
    me.init = function() {
        me.loadConnectionStringHistory();

        me.elements.button.addEventListener('click', function(e) {
            console.log(e);
            var uri = me.elements.input.value.trim();
            
            if (uri.length === 0) {
                return;
            }
            
            try {
                me.closeWebsocket();
            } catch (err) {
                console.error(err);
            }
            
            me.CONNECTION_STRING = uri;
            me.openWebsocket();
            me.elements.message.focus();
        });

        me.elements.send.addEventListener('click', function(e) {
            console.log(e);
            var message = me.elements.message.value.trim();

            if (message.length === 0) {
                return;
            }

            me.websocket.send(message);
            me.elements.message.value = "";
            me.elements.message.focus();
        });

        me.elements.input.addEventListener('keydown', function(e) {
            console.log(e);
            if (e.keyCode === 13) {
                e.preventDefault();
                me.elements.button.click();
            }
        });
    };

    me.putConnectionStringHistory = function() {
        var innerHTML = '';
        for (var i = 0; i < me.connection_string_history.length; i++) {
            var connection_string = me.connection_string_history[i];
            innerHTML += '<option>' + connection_string + '</option>';
        }
        me.elements.datalist.innerHTML = innerHTML;
    };

    me.loadConnectionStringHistory = function() {
        try {
            me.connection_string_history = JSON.parse(localStorage.getItem('connection_string_history') || '[]');
        } catch (err) {
            console.error(err);
            me.connection_string_history = [];
        }
        me.putConnectionStringHistory();
    };

    me.saveConnectionStringHistory = function() {
        try {
            localStorage.setItem('connection_string_history', JSON.stringify(me.connection_string_history));
        } catch (err) {
            console.error(err);
        }
    };

    me.addConnectionString = function(connection_string) {
        //remove any duplicate strings
        for (var i = me.connection_string_history.length-1; i >= 0; i--) {
            var cs = me.connection_string_history[i];
            if (cs === connection_string) {
                me.connection_string_history.splice(i, 1);
            }
        }
        me.connection_string_history.unshift(connection_string);
        me.saveConnectionStringHistory();
        me.putConnectionStringHistory();
    };

    me.log = function(message) {
        var json;
        try {
            json = JSON.parse(message);
        } catch(err) {
            json = null;
        }

        if (json) {
            message = '<pre>' + JSON.stringify(json, null, 1) + '</pre>'
        }
        me.elements.log.innerHTML = '<li><div>' + new Date + '</div>' + message + '</li>' + me.elements.log.innerHTML;
    };
			
    me.openWebsocket = function() {
        me.websocket = new WebSocket(me.CONNECTION_STRING);
				
		me.websocket.onopen = function(e) {
		    console.log('websocket opened', e);
            me.log('websocket opened');
            me.addConnectionString(me.CONNECTION_STRING);
		};
				
		me.websocket.onclosed = function(e) {
		    console.log('websocket closed', e);
		    me.log('websocket closed');
		};
				
		me.websocket.onerror = function(e) {
		    console.error('websocket error', e);
		    me.log('websocket error');
		};
				
		me.websocket.onmessage = function(e) {
		    console.log('websocket message', e);
		    me.log(e.data);
		};
    };
			
	me.closeWebsocket = function() {
        me.websocket.close();
        me.log('websocket closed');
    }

    me.init();
}