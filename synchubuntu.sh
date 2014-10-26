#!/bin/sh
LOCALFOLDER='almondroot'
REMOTEIP='10.10.10.121'
REMOTEUSER='root'
REMOTEPASS='root'

shopt -s globstar
FILES=$LOCALFOLDER/**

function pathToArray {
	PATHARRAY=()
	IFS='/' read -ra ADDR <<< "$1"
	for i in "${ADDR[@]}"; do
	    PATHARRAY+=($i)
	done
}

function buildDir {
	pathToArray $2
	PATHBUILDCOMMAND="cd / && "
	BUILTPATH=""
	for (( i=0; i<${#PATHARRAY[@]}-1; i++ ))
	do
	   PATHBUILDCOMMAND+="cd ${PATHARRAY[i]} || (mkdir ${PATHARRAY[i]} && cd ${PATHARRAY[i]}) &&"
	   BUILTPATH+="${PATHARRAY[i]}/"
	done
	PATHBUILDCOMMAND+="echo \"Just Built $BUILTPATH\""
	sshpass -p $REMOTEPASS ssh $REMOTEUSER@$REMOTEIP "$PATHBUILDCOMMAND"
	sshpass -p $REMOTEPASS scp -r $1 "$REMOTEUSER@$REMOTEIP:/$2"
}

function update {
	sshpass -p $REMOTEPASS scp -r $1 "$REMOTEUSER@$REMOTEIP:/$2"  || buildDir "$1" "$2"
}

function cdRoot {
	REMOTEPATH=$(expr $1 : '[^/]*/\(.*\)')
}

function updateFileDirectory {
	for LOCALPATH in $(find $LOCALFOLDER -type f | grep -v '/\.')
	do
		cdRoot "$LOCALPATH"
		CHANGES=$(sshpass -p $REMOTEPASS ssh $REMOTEUSER@$REMOTEIP "cat /$REMOTEPATH" | diff - $LOCALPATH)
		if [ "$CHANGES" != "" ] 
		then
			echo "$CHANGES"
			echo "-----------------"
		    update "$LOCALPATH" "$REMOTEPATH"
		fi
	done
}

function syncFileDirectory {
	inotifywait -m -r --format '%w%f %f' -e modify -e move -e create -e delete $LOCALFOLDER | while read LOCALPATH LOCALFILE
	do
		if [[ $LOCALFILE != .* ]] 
		then
			cdRoot "$LOCALPATH"
			update "$LOCALPATH" "$REMOTEPATH"
			echo "$REMOTEPATH"
			echo "-----------------"
		fi
	done
}

count=$( ping -w -c 1 $REMOTEIP | grep icmp* | wc -l )

echo $count

if [ $count -eq 0 ]
then
    echo "I couldn't find the Almond, so go buy one and try again"
else
	updateFileDirectory
	syncFileDirectory
fi
