
scp -P 54321 src/lib/* monadmin@192.168.0.10:/home/monadmin/asw/src/lib/;
scp -P 54321 servers/cntr/* monadmin@192.168.0.10:/home/monadmin/asw/servers/cntr/;
scp -P 54321 servers/model/* monadmin@192.168.0.10:/home/monadmin/asw/servers/model/;
ssh -p 54321 monadmin@192.168.0.10