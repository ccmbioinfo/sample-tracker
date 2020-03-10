FROM python:3.7-slim

WORKDIR /var/www/sample-tracker
COPY . .

RUN pip3 install -r requirements.txt

ENV FLASK_APP sample_tracker.py
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
EXPOSE 5000

CMD ["./flask.sh"]
