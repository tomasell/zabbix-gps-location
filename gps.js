#!/usr/bin/env node
var net = require('net-socket');
var dms2dec = require('dms2dec');
var ZabbixSender = require('node-zabbix-sender');
var Sender = new ZabbixSender({host: '127.0.0.1'});
var socket = net.connect(23, process.argv[3]);
var buffer = "";
var regex = /\$GPR[\S]?MC,[\d\.]*,[\w]{1},(\d{1,3})(\d{2}).(\d{2})\d*,([\w]{1}),(\d{1,3})(\d{2}).(\d{2})\d*,([\w]{1})/g;
socket.setEncoding('utf8');
socket.on('data', (data) => {
	buffer += data.toString();
	var parser = regex.exec(buffer);
	if (parser && parser.length == 9) {
		socket.end();
		socket.destroy();
		parser.shift();
		parser = parser.map(num => {
			if (isNaN(parseInt(num))) {
				return num;
			}
			return parseInt(num);
		});
		var location = dms2dec([parser[0], parser[1], parser[2]], parser[3], [parser[4], parser[5], parser[6]], parser[7]);
		Sender.addItem(process.argv[2], 'gps.latitude', location[0]);
		Sender.addItem(process.argv[2], 'gps.longitude', location[1]);
		Sender.send(function(err, res) {
			if (err) {
				throw err;
			}
			console.dir(res);
		});
	}
});
