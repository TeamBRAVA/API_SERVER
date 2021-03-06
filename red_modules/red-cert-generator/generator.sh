#! /bin/bash
BASEDIR=$(dirname $0)"/tmp"

# Check user input
ncerts=$1
ca_pem_path=$2
ca_key_path=$3
ca_passphrase=$4

re='^[0-9]+$'

if ! [[ $ncerts =~ $re ]] ; then
   echo "The number of certificates is not a number." >&2; exit 0
fi
if ! [ -e $ca_pem_path ] ; then
   echo "The path to the specified CA PEM file does not exist." >&2; exit 0
fi
if ! [ -e $ca_key_path ] ; then
   echo "The path to the specified CA KEY file does not exist." >&2; exit 0
fi


# Clear environment
rm $BASEDIR/device.key &> /dev/null
rm $BASEDIR/device.csr &> /dev/null
rm $BASEDIR/device.crt &> /dev/null
rm $BASEDIR/device.p12 &> /dev/null
rm $BASEDIR/device.key &> /dev/null

mkdir $BASEDIR &> /dev/null
mkdir $BASEDIR/certificates &> /dev/null
mkdir $BASEDIR/passphrases &> /dev/null

rm -rf $BASEDIR/certificates/* &> /dev/null
rm -rf $BASEDIR/passphrases/* &> /dev/null
touch $BASEDIR/passphrases/passphrases.txt

for i in `seq 1 $ncerts`
do
	passphrase=$(hexdump -n 5 -v -e '/1 "%02X"' /dev/urandom)
	openssl genrsa -des3 -out $BASEDIR/device.key -passout pass:$passphrase 2048 &> /dev/null
	openssl req -new -key $BASEDIR/device.key -out $BASEDIR/device.csr -passin pass:$passphrase -subj "/C=FR/ST=Ile-de-France/L=Paris/O=RED/CN=DEVICE" &> /dev/null
	openssl x509 -req -days 36500 '-in' $BASEDIR/device.csr -CA $ca_pem_path -CAkey $ca_key_path -CAcreateserial -out $BASEDIR/device.crt -passin pass:$ca_passphrase &> /dev/null
	if ! [ -s $BASEDIR/"device.crt" ] ; then
   		echo "$ca_passphrase The specified CA KEY file passphrase is not correct." >&2
   		rm $BASEDIR/device.key &> /dev/null
   		rm $BASEDIR/device.csr &> /dev/null
   		rm $BASEDIR/device.crt &> /dev/null
   		exit 0
	fi
	openssl pkcs12 -export -clcerts '-in' $BASEDIR/device.crt -inkey $BASEDIR/device.key -out $BASEDIR/device.p12 -passin pass:$passphrase -passout pass:$passphrase &> /dev/null
	openssl pkcs12 '-in' $BASEDIR/device.p12 -out $BASEDIR/device.pem -clcerts -passin pass:$passphrase -passout pass:$passphrase &> /dev/null
	rm $BASEDIR/device.key &> /dev/null
	rm $BASEDIR/device.csr &> /dev/null
	rm $BASEDIR/device.crt &> /dev/null
	rm $BASEDIR/device.p12 &> /dev/null
	mv $BASEDIR/device.pem $BASEDIR/certificates/$i.pem
	echo $passphrase >> $BASEDIR/passphrases/passphrases.txt
done

echo $i" certificates have been successfully generated"
