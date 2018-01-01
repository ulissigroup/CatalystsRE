FROM ubuntu:17.10
LABEL author="Zack Ulissi <zulissi@andrew.cmu.edu>"

RUN apt-get update
RUN apt-get dist-upgrade -y
RUN apt install wget bzip2  git build-essential libgl1-mesa-glx -y

RUN apt-get install -y curl
RUN apt-get install default-jre -y
RUN /bin/bash -c "curl -sL https://deb.nodesource.com/setup_8.x | bash -"
RUN apt-get install -y nodejs
RUN wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.0.0.deb
RUN apt install apt-transport-https
RUN /bin/bash -c 'echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-6.x.list'
RUN /bin/bash -c 'wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -'
RUN apt-get update
RUN apt install elasticsearch
#RUN /bin/bash -c "dpkg -i elasticsearch-6.0.0.deb "
EXPOSE 9200

ADD ./ /home/CatalystsRE
RUN /bin/bash -c "cd /home/CatalystsRE;npm install"
EXPOSE 3000

ADD /start.sh /home/
CMD /bin/bash -c "source /home/start.sh"
