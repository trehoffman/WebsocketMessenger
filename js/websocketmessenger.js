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
        send: document.querySelector('button.send'),
        filterText: document.querySelector('input.filter-text')
    };
    me.connection_string_history = [];
    me.message_history = [];
    me.filter_text = '';
    
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
            console.log('click', e);
            var message = me.elements.message.value.trim();

            if (message.length === 0) {
                return;
            }

            me.websocket.send(message);
            me.elements.message.value = "";
            me.elements.message.focus();
        });

        me.elements.input.addEventListener('keydown', function(e) {
            console.log('keydown', e);
            if (e.keyCode === 13) {
                e.preventDefault();
                me.elements.button.click();
            }
        });

        me.elements.log.addEventListener('click', function(e) {
            var listitem = e.target.closest('li');
            var index = parseInt(listitem.getAttribute('index'));
            var message = me.message_history[index];

            if (e.target.classList.contains('copy')) {
                me.copyToClipboard(message.message || '');
                return;
            }
        });

        me.elements.log.addEventListener('dblclick', function(e) {
            //hide or show message area
            var listitem = e.target.closest('li');
            var messagearea = listitem.querySelector('.message-area');
            var accordianindicator = listitem.querySelector('.accordian-indicator');
            if (messagearea.classList.contains('hidden')) {
                messagearea.classList.remove('hidden');
                accordianindicator.innerHTML = '&#8595;'
            } else {
                messagearea.classList.add('hidden');
                accordianindicator.innerHTML = '&#8594;'
            }
        });

        me.elements.filterText.addEventListener('keyup', function(e) {
            me.filter_text = e.target.value;
            me.filter();
        });
    };

    me.copyToClipboard = function(message) {
        var dummy = document.createElement('textarea');
        document.body.appendChild(dummy);
        dummy.value = message || '';
        dummy.select();
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        document.body.removeChild(dummy);
    }

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
        var timestamp = new Date;
        var index = (me.message_history.push({
            timestamp: timestamp,
            message: message
        }) - 1);

        var json;
        try {
            json = JSON.parse(message);
        } catch(err) {
            json = null;
        }

        if (json) {
            message = JSON.stringify(json, null, 1);
        }
        me.elements.log.innerHTML = '<li index="' + index + '">'
            + '<div><span>' + timestamp + '</span>'
            + '<span><button type="button" class="copy">Copy</button><span>'
            + '<span class="accordian-indicator">&#8595;</span>'
            + '</div>'
            + '<pre class="message-area">' + message + '</pre>'
            + '</li>' 
            + me.elements.log.innerHTML;
        me.filter();
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

    me.filter = function() {
        var log_entries = me.elements.log.querySelectorAll('li');
        for (var i = 0; i < log_entries.length; i++) {
            var log_entry = log_entries[i];
            log_entry.classList.remove('hidden');
        }

        if (me.filter_text.length > 0) {
            for (var i = 0; i < log_entries.length; i++) {
                var log_entry = log_entries[i];
                if (log_entry.innerHTML.toLowerCase().includes(me.filter_text.toLowerCase())) {
                    log_entry.classList.remove('hidden');
                } else {
                    log_entry.classList.add('hidden');
                }
            }
        }
    };

    me.init();
}