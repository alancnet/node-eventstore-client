var util = require('util');
var uuid = require('uuid');
var client = require('../src/client');

function createRandomEvent() {
  return client.createJsonEventData(uuid.v4(), {a: uuid.v4(), b: Math.random()}, {createdAt: Date.now()}, 'testEvent');
}

module.exports = {
  'Test Subscribe to Stream From Beginning (null)': function(test) {
    test.expect(22);
    var self = this;
    var liveProcessing = false;
    var catchUpEvents = [];
    var liveEvents = [];
    var _doneCount = 0;

    function done(err) {
      test.ok(!err, err ? err.stack : '');
      if (++_doneCount < 2) return;
      test.done();
    }

    function eventAppeared(s, e) {
      if (liveProcessing) {
        liveEvents.push(e);
        s.stop();
      } else {
        catchUpEvents.push(e);
      }
    }
    function liveProcessingStarted() {
      liveProcessing = true;
      var events = [createRandomEvent()];
      self.conn.appendToStream(self.testStreamName, client.expectedVersion.any, events)
          .then(function () {
            done();
          })
          .catch(done);
    }
    function subscriptionDropped(connection, reason, error) {
      test.ok(liveEvents.length === 1, "Expecting 1 live event, got " + liveEvents.length);
      test.testLiveEvent('liveEvents[0]', liveEvents[0]);
      test.ok(liveEvents[0].originalEventNumber, 1);
      test.ok(catchUpEvents.length === 1, "Expecting 1 catchUp event, got " + catchUpEvents.length);
      test.testReadEvent('catchUpEvents[0]', catchUpEvents[0]);
      test.ok(liveEvents[0].originalEventNumber, 0);
      done(error);
    }

    var events = [createRandomEvent()];
    this.conn.appendToStream(self.testStreamName, client.expectedVersion.noStream, events)
      .then(function() {
        var subscription = self.conn.subscribeToStreamFrom(self.testStreamName, null, false, eventAppeared, liveProcessingStarted, subscriptionDropped);

        test.areEqual("subscription.streamId", subscription.streamId, self.testStreamName);
        test.areEqual("subscription.isSubscribedToAll", subscription.isSubscribedToAll, false);
        test.areEqual("subscription.readBatchSize", subscription.readBatchSize, 500);
        test.areEqual("subscription.maxPushQueueSize", subscription.maxPushQueueSize, 10000);
      })
      .catch(test.done);
  },
  'Test Subscribe to Stream From 0': function(test) {
    test.expect(22);
    var self = this;
    var liveProcessing = false;
    var catchUpEvents = [];
    var liveEvents = [];
    var _doneCount = 0;

    function done(err) {
      test.ok(!err, err ? err.stack : '');
      if (++_doneCount < 2) return;
      test.done();
    }

    function eventAppeared(s, e) {
      if (liveProcessing) {
        liveEvents.push(e);
        s.stop();
      } else {
        catchUpEvents.push(e);
      }
    }
    function liveProcessingStarted() {
      liveProcessing = true;
      var events = [createRandomEvent()];
      self.conn.appendToStream(self.testStreamName, client.expectedVersion.any, events)
        .then(function () {
          done();
        })
        .catch(done);
    }
    function subscriptionDropped(connection, reason, error) {
      test.ok(liveEvents.length === 1, "Expecting 1 live event, got " + liveEvents.length);
      test.testLiveEvent('liveEvents[0]', liveEvents[0]);
      test.ok(liveEvents[0].originalEventNumber, 2);
      test.ok(catchUpEvents.length === 1, "Expecting 1 catchUp event, got " + catchUpEvents.length);
      test.testReadEvent('catchUpEvents[0]', catchUpEvents[0]);
      test.ok(liveEvents[0].originalEventNumber, 1);
      done(error);
    }

    var events = [createRandomEvent(), createRandomEvent()];
    this.conn.appendToStream(self.testStreamName, client.expectedVersion.noStream, events)
      .then(function() {
        var subscription = self.conn.subscribeToStreamFrom(self.testStreamName, 0, false, eventAppeared, liveProcessingStarted, subscriptionDropped);

        test.areEqual("subscription.streamId", subscription.streamId, self.testStreamName);
        test.areEqual("subscription.isSubscribedToAll", subscription.isSubscribedToAll, false);
        test.areEqual("subscription.readBatchSize", subscription.readBatchSize, 500);
        test.areEqual("subscription.maxPushQueueSize", subscription.maxPushQueueSize, 10000);
      })
      .catch(test.done);
  }
};

require('./common/base_test').init(module.exports);