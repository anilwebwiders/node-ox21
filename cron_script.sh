#!/bin/bash
#this script is ment to be executed by a Cron task that repeats every minute

#curl http://ox21nft.xyz/api/check_cron

for i in {1..20}
do
        curl http://ox21nft.xyz/api/check_cron
        sleep 3
done
