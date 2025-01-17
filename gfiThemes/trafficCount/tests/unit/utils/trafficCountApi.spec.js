import {expect} from "chai";
import {TrafficCountApi} from "../../../utils/trafficCountApi";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

// change language from day.js to german
require("dayjs/locale/de.js");
dayjs.locale("de");

describe("addons/trafficCount/utils/trafficCountApi.js", () => {
    describe("TrafficCountApi.constructor", () => {
        describe("SensorThingsHttp", () => {
            it("should take the given dummy instead of creating a new instance of SensorThingsHttp", () => {
                const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "foo", "sensorThingsMqttOpt", "noSingletonOpt");

                expect(api.getSensorThingsHttp()).to.equal("foo");
            });
            it("should create a new instance of SensorThingsHttp on construction if no dummy was given", () => {
                const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", false, "sensorThingsMqttOpt", "noSingletonOpt");

                expect(api.getSensorThingsHttp().constructor.name).to.equal("SensorThingsHttp");
            });
        });

        describe("SensorThingsMqtt", () => {
            it("should take the given dummy instead of creating a new instance of SensorThingsMqtt", () => {
                const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "foo", "noSingletonOpt");

                expect(api.getMqttClient()).to.equal("foo");
            });
        });

        describe("baseUrlHttp", () => {
            it("should set the base url for http calls correctly at construction", () => {
                const api = new TrafficCountApi("https://www.example.com/foo", "version1234", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt");

                expect(api.getBaseUrlHttp()).to.equal("https://www.example.com/foo/version1234");
            });
        });

        describe("subscriptionTopics", () => {
            it("should set the subscription topics as an empty object at time of construction", () => {
                const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt");

                expect(api.getSubscriptionTopics()).to.be.an("object").and.to.be.empty;
            });
        });

        describe("SensorThingsMqttClient", () => {
            it("should set the on message event with an event", () => {
                let lastEventName = false,
                    lastCallback = false;
                const dummySensorThingsMqtt = {
                    on: (eventName, callback) => {
                        lastEventName = eventName;
                        lastCallback = callback;
                    }
                };

                new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", dummySensorThingsMqtt, "noSingletonOpt");

                expect(lastEventName).to.equal("message");
                expect(typeof lastCallback).to.equal("function");
            });
            it("should set the on message event with an event(topic, payload) that will give payload to all callbacks stored in subscriptionTopics[topic]", () => {
                let lastCallback = false;
                const dummySensorThingsMqtt = {
                        on: (eventName, callback) => {
                            lastCallback = callback;
                        }
                    },
                    api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", dummySensorThingsMqtt, "noSingletonOpt"),
                    lastPayloads = [];

                api.setSubscriptionTopics({
                    "foo": [
                        (payload) => {
                            lastPayloads.push(payload);
                        },
                        (payload) => {
                            lastPayloads.push(payload);
                        },
                        (payload) => {
                            lastPayloads.push(payload);
                        }
                    ]
                });

                expect(typeof lastCallback).to.equal("function");

                lastCallback("baz", "qux");
                expect(lastPayloads).to.be.an("array").that.is.empty;

                lastCallback("foo", "bar");
                expect(lastPayloads).to.deep.equal(["bar", "bar", "bar"]);
            });
        });
    });

    describe("TrafficCountApi.checkForObservations", () => {
        it("should check if the given dataset is an array with an object that has a key Datastreams which is an array with an object with an id and a key Observations that is an array", () => {
            const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt"),
                dataset = [
                    {
                        Datastreams: [
                            {
                                "@iot.id": "foo",
                                Observations: []
                            }
                        ]
                    }
                ];

            expect(api.checkForObservations(dataset)).to.be.true;
            expect(api.checkForObservations([{}])).to.be.false;
        });
    });

    describe("TrafficCountApi.sumObservations", () => {
        it("should sum up the given observations", () => {
            const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt"),
                dataset = [{
                    Datastreams: [{
                        "@iot.id": "foo",
                        Observations: [
                            {result: 1},
                            {result: 2},
                            {result: 3},
                            {result: 4}
                        ]
                    }]
                }];

            expect(api.sumObservations(dataset)).to.equal(10);
            expect(api.sumObservations([{}])).to.be.false;
        });
    });

    describe("TrafficCountApi.getFirstDate", () => {
        it("should fetch the oldest date from the given observations", () => {
            const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt"),
                dataset = [{
                    Datastreams: [{
                        "@iot.id": "foo",
                        Observations: [
                            {phenomenonTime: "B date"},
                            {phenomenonTime: "C date"},
                            {phenomenonTime: "000000"},
                            {phenomenonTime: "D date"}
                        ]
                    }]
                }];

            expect(api.getFirstDate(dataset)).to.equal("000000");
            expect(api.getFirstDate([{}])).to.be.false;
        });
        it("should take an initial date to account for the best first date initialy", () => {
            const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt"),
                dataset = [{
                    Datastreams: [{
                        "@iot.id": "foo",
                        Observations: [
                            {phenomenonTime: "C date"},
                            {phenomenonTime: "D date"},
                            {phenomenonTime: "B not first"},
                            {phenomenonTime: "E date"}
                        ]
                    }]
                }];

            expect(api.getFirstDate(dataset, "A first")).to.equal("A first");
            expect(api.getFirstDate([{}])).to.be.false;
        });
    });

    describe("TrafficCountApi.parsePhenomenonTime", () => {
        const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt");

        it("should split the given string interval delimited by '/' and return the agreed part", () => {
            const interval = "foo/bar",
                expectedOutcome = "foo";

            expect(api.parsePhenomenonTime(interval)).to.equal(expectedOutcome);
        });
        it("should return the given string if no delimitor was found", () => {
            const interval = "bar",
                expectedOutcome = "bar";

            expect(api.parsePhenomenonTime(interval)).to.equal(expectedOutcome);
        });
        it("should return an empty string if unexpected input is given", () => {
            expect(api.parsePhenomenonTime(undefined)).to.be.a("string").and.to.be.empty;
            expect(api.parsePhenomenonTime(null)).to.be.a("string").and.to.be.empty;
            expect(api.parsePhenomenonTime("")).to.be.a("string").and.to.be.empty;
            expect(api.parsePhenomenonTime(false)).to.be.a("string").and.to.be.empty;
            expect(api.parsePhenomenonTime(123456)).to.be.a("string").and.to.be.empty;
            expect(api.parsePhenomenonTime([])).to.be.a("string").and.to.be.empty;
            expect(api.parsePhenomenonTime({})).to.be.a("string").and.to.be.empty;
        });
    });

    describe("TrafficCountApi.mqttSubscribe", () => {
        it("should push a handler for the given topic on subscription topics", () => {
            const api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", "sensorThingsMqttOpt", "noSingletonOpt");

            api.setSubscriptionTopics({});
            api.mqttSubscribe("foo", false, "bar");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), "foo")).to.be.true;
            expect(api.getSubscriptionTopics().foo).to.be.an("array").that.is.not.empty;
            expect(api.getSubscriptionTopics().foo[0]).to.equal("bar");
        });
        it("should use the mqtt client to subscribe to a topic with the given options", () => {
            let lastTopic = false,
                lastMqttOptions = false;
            const dummySensorThingsMqtt = {
                    subscribe: (topic, mqttOptions) => {
                        lastTopic = topic;
                        lastMqttOptions = mqttOptions;
                    }
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", dummySensorThingsMqtt, "noSingletonOpt");

            api.mqttSubscribe("foo", "quix");

            expect(lastTopic).to.equal("foo");
            expect(lastMqttOptions).to.equal("quix");
        });
        it("should call mqtt subscribe each time. We don't recycle mqtt subscriptions anymore.", () => {
            let lastTopic = false,
                lastMqttOptions = false;
            const dummySensorThingsMqtt = {
                    subscribe: (topic, mqttOptions) => {
                        lastTopic = topic;
                        lastMqttOptions = mqttOptions;
                    }
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", "sensorThingsHttpOpt", dummySensorThingsMqtt, "noSingletonOpt");

            api.mqttSubscribe("nofoo", "noquix");
            api.mqttSubscribe("foo", "quix");

            expect(lastTopic).to.equal("foo");
            expect(lastMqttOptions).to.equal("quix");
        });
    });

    describe("TrafficCountApi.updateTitle", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", dummySensorThingsHttp, "sensorThingsMqttOpt", "noSingletonOpt");

            api.updateTitle("thingId", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastUrl).to.equal("httpHost/sensorThingsVersion/Things(thingId)");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with the property name of the first element in the received payload", () => {
            let lastTitle = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            name: "foo"
                        }]);
                    }
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", dummySensorThingsHttp, "sensorThingsMqttOpt", "noSingletonOpt");

            api.updateTitle(false, title => {
                lastTitle = title;
            });

            expect(lastTitle).to.equal("foo");
        });
        it("should call onerror with an error message if no property name was found on the first element in the received payload", () => {
            let lastError = false;
            const dummySensorThingsHttp = {
                    get: false
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", dummySensorThingsHttp, "sensorThingsMqttOpt", "noSingletonOpt");

            lastError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                return onupdate([{
                    foo: "bar"
                }]);
            };
            api.updateTitle(false, false, (error) => {
                lastError = error;
            });
            expect(lastError).to.be.a.string;

            lastError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                onupdate(["foo"]);
                return false;
            };
            api.updateTitle(false, false, (error) => {
                lastError = error;
            });
            expect(lastError).to.be.a.string;

            lastError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                onupdate("foo");
                return false;
            };
            api.updateTitle(false, false, (error) => {
                lastError = error;
            });
            expect(lastError).to.be.a.string;

            lastError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                onupdate();
                return false;
            };
            api.updateTitle(false, false, (error) => {
                lastError = error;
            });
            expect(lastError).to.be.a.string;
        });
    });

    describe("TrafficCountApi.updateDirection", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", dummySensorThingsHttp, "sensorThingsMqttOpt", "noSingletonOpt");

            api.updateDirection("thingId", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastUrl).to.equal("httpHost/sensorThingsVersion/Things(thingId)");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with the property child element 'richtung' of the first element in the received payload", () => {
            let getDirection = "";
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            properties: {
                                richtung: "2"
                            }
                        }]);
                    }
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", dummySensorThingsHttp, "sensorThingsMqttOpt", "noSingletonOpt");

            api.updateDirection(false, direction => {
                getDirection = direction;
            });

            expect(getDirection).to.equal("2");
        });
        it("should call onerror with an error message if no property child element 'richtung' was found on the first element in the received payload", () => {
            let getError = false;
            const dummySensorThingsHttp = {
                    get: false
                },
                api = new TrafficCountApi("httpHost", "sensorThingsVersion", "mqttOptions", dummySensorThingsHttp, "sensorThingsMqttOpt", "noSingletonOpt");

            getError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                return onupdate([{
                    foo: "bar"
                }]);
            };
            api.updateDirection(false, false, (error) => {
                getError = error;
            });
            expect(getError).to.be.a.string;

            getError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                onupdate(["foo"]);
                return false;
            };
            api.updateDirection(false, false, (error) => {
                getError = error;
            });
            expect(getError).to.be.a.string;

            getError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                onupdate("foo");
                return false;
            };
            api.updateDirection(false, false, (error) => {
                getError = error;
            });
            expect(getError).to.be.a.string;

            getError = false;
            dummySensorThingsHttp.get = (url, onupdate) => {
                onupdate();
                return false;
            };
            api.updateDirection(false, false, (error) => {
                getError = error;
            });
            expect(getError).to.be.a.string;
        });
    });

    describe("TrafficCountApi.updateDay", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedFrom = new Date("2020-03-20 00:00:00").toISOString(),
                expectedUntil = new Date("2020-03-21 00:00:00").toISOString();

            api.updateDay("thingId", "meansOfTransport", "2020-03-20", "onupdate", "onerror", "onstart", "oncomplete", "dayTodayOpt");

            expect(lastUrl).to.equal("https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_15-Min';$expand=Observations($filter=phenomenonTime ge " + expectedFrom + " and phenomenonTime lt " + expectedUntil + "))");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with a sum of all given observation result values", () => {
            let lastDate = false,
                lastValue = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1},
                                    {result: 2},
                                    {result: 3},
                                    {result: 4}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDate = "2020-03-20",
                expectedValue = 10;

            api.updateDay("thingId", "meansOfTransport", expectedDate, (date, value) => {
                lastDate = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete", "dayTodayOpt");

            expect(lastDate).to.equal(expectedDate);
            expect(lastValue).to.equal(expectedValue);
        });
        it("should initialize mqtt subscription on topic with given options if the given day equals today", () => {
            let lastTopic = false,
                lastMqttOptions = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: []
                            }]
                        }]);
                    }
                },
                dummySensorThingsMqtt = {
                    subscribe: (topic, mqttOptions) => {
                        lastTopic = topic;
                        lastMqttOptions = mqttOptions;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, dummySensorThingsMqtt, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations",
                expectedMqttOptions = {rh: 2};

            // hint: day === dayTodayOpt with "day" === "day"
            api.updateDay("thingId", "meansOfTransport", "2020-03-20", "onupdate", "onerror", "onstart", "oncomplete", "2020-03-20");

            expect(lastTopic).to.equal(expectedTopic);
            expect(lastMqttOptions).to.deep.equal(expectedMqttOptions);
        });
        it("should not initialize mqtt subscription on topic with given options if the given day does not equal today", () => {
            let lastTopic = false,
                lastMqttOptions = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: []
                            }]
                        }]);
                    }
                },
                dummySensorThingsMqtt = {
                    subscribe: (topic, mqttOptions) => {
                        lastTopic = topic;
                        lastMqttOptions = mqttOptions;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, dummySensorThingsMqtt, "noSingletonOpt");

            // hint: day !== dayTodayOpt with "day" !== "today"
            api.updateDay("thingId", "meansOfTransport", "2020-03-20", "onupdate", "onerror", "onstart", "oncomplete", "2020-03-21");

            expect(lastTopic).to.be.false;
            expect(lastMqttOptions).to.be.false;
        });
        it("should add any number received by observation.result via mqtt to the current sum and call onupdate", () => {
            let lastSum = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1},
                                    {result: 2},
                                    {result: 3},
                                    {result: 4}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations";

            api.setSubscriptionTopics({});

            // hint: day === dayTodayOpt with "day" === "day"
            api.updateDay("thingId", "meansOfTransport", "2020-03-20", (date, value) => {
                lastSum = value;
            }, "onerror", "onstart", "oncomplete", "2020-03-20");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopic][0]({result: 5});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 6});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 7});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 8});

            expect(lastSum).to.equal(36);
        });
        it("should call onerror if no observation was found in http response", () => {
            let lastErrorMessage = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                wrongObservations: []
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi(false, false, {}, dummySensorThingsHttp, true, "noSingletonOpt");

            // hint: day === dayTodayOpt with "day" === "day"
            api.updateDay("thingId", "meansOfTransport", "2020-03-20", "onupdate", (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete", "2020-03-20");

            expect(lastErrorMessage).to.be.a("string");
        });
        it("should call on error if a received observation via mqtt has no result key", () => {
            let lastErrorMessage = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: []
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations";

            // hint: day === dayTodayOpt with "day" === "day"
            api.updateDay("thingId", "meansOfTransport", "2020-03-20", "onupdate", (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete", "2020-03-20");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopic][0]({wrongResult: 1});

            expect(lastErrorMessage).to.be.a("string");
        });
    });

    describe("TrafficCountApi.updateYear", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedFrom = new Date("2020-01-01 00:00:00").toISOString(),
                expectedUntil = new Date("2021-01-01 00:00:00").toISOString();

            api.updateYear("thingId", "meansOfTransport", "2020", "onupdate", "onerror", "onstart", "oncomplete", "2021");

            expect(lastUrl).to.equal("https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_1-Tag';$expand=Observations($filter=phenomenonTime ge " + expectedFrom + " and phenomenonTime lt " + expectedUntil + "))");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with a sum of all given observation result values if year does not equal todays year", () => {
            let lastDate = false,
                lastValue = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1},
                                    {result: 2},
                                    {result: 3},
                                    {result: 4}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDate = "2020",
                expectedValue = 10;

            api.updateYear("thingId", "meansOfTransport", "2020", (date, value) => {
                lastDate = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete", "2021");

            expect(lastDate).to.equal(expectedDate);
            expect(lastValue).to.equal(expectedValue);
        });
        it("should call onupdate with a sum of all observations for the _1-Tag and _15-Min urls if year does equal todays year", () => {
            let lastDate = false,
                lastValue = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        if (url.indexOf("_1-Tag") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "foo",
                                    Observations: [
                                        {result: 1},
                                        {result: 2},
                                        {result: 3},
                                        {result: 4}
                                    ]
                                }]
                            }]);
                        }
                        else if (url.indexOf("_15-Min") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "bar",
                                    Observations: [
                                        {result: 5},
                                        {result: 6},
                                        {result: 7},
                                        {result: 8}
                                    ]
                                }]
                            }]);
                        }
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDate = "2020",
                expectedValue = 36;

            api.updateYear("thingId", "meansOfTransport", "2020", (date, value) => {
                lastDate = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete", "2020");

            expect(lastDate).to.equal(expectedDate);
            expect(lastValue).to.equal(expectedValue);
        });
        it("should not initialize mqtt subscription on topic with given options if the given year does not equal todays year", () => {
            let lastTopic = false,
                lastMqttOptions = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: []
                            }]
                        }]);
                    }
                },
                dummySensorThingsMqtt = {
                    subscribe: (topic, mqttOptions) => {
                        lastTopic = topic;
                        lastMqttOptions = mqttOptions;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, dummySensorThingsMqtt, "noSingletonOpt");

            // hint: year !== yearTodayOpt with "year" !== "todays year"
            api.updateYear("thingId", "meansOfTransport", "2020", "onupdate", "onerror", "onstart", "oncomplete", "2021");

            expect(lastTopic).to.be.false;
            expect(lastMqttOptions).to.be.false;
        });
        it("should add any number received by observation.result via mqtt to the current sum and call onupdate", () => {
            let lastSum = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        if (url.indexOf("_1-Tag") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "foo",
                                    Observations: [
                                        {result: 1},
                                        {result: 2},
                                        {result: 3},
                                        {result: 4}
                                    ]
                                }]
                            }]);
                        }
                        else if (url.indexOf("_15-Min") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "bar",
                                    Observations: [
                                        {result: 5},
                                        {result: 6},
                                        {result: 7},
                                        {result: 8}
                                    ]
                                }]
                            }]);
                        }
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(bar)/Observations";

            api.setSubscriptionTopics({});

            // hint: year === yearTodayOpt with "year" === "todays year"
            api.updateYear("thingId", "meansOfTransport", "2020", (date, value) => {
                lastSum = value;
            }, "onerror", "onstart", "oncomplete", "2020");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopic][0]({result: 9});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 10});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 11});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 12});

            expect(lastSum).to.equal(78);
        });
        it("should call onerror if no observation was found in http response", () => {
            let lastErrorMessage = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                wrongObservations: []
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi(false, false, {}, dummySensorThingsHttp, true, "noSingletonOpt");

            // hint: year === yearTodayOpt with "year" === "todays year"
            api.updateYear("thingId", "meansOfTransport", "2020", "onupdate", (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete", "2020");

            expect(lastErrorMessage).to.be.a("string");
        });
        it("should call on error if a received observation via mqtt has no result key", () => {
            let lastErrorMessage = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: []
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations";

            // hint: year === yearTodayOpt with "year" === "todays year"
            api.updateYear("thingId", "meansOfTransport", "2020", "onupdate", (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete", "2020");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopic][0]({wrongResult: 1});

            expect(lastErrorMessage).to.be.a("string");
        });
    });

    describe("TrafficCountApi.updateTotal", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                lastMonday = dayjs().startOf("isoWeek").toISOString();

            api.updateTotal("thingId", "meansOfTransport", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastUrl).to.equal("https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_1-Woche';$expand=Observations($filter=phenomenonTime lt " + lastMonday + "))");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal(false);
        });
        it("should call onupdate with a sum of all given observation result values", () => {
            let lastFirstDate = false,
                lastValue = false;
            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                phenomenonTimeB = "2020-03-23T12:14:30.123Z",
                phenomenonTimeC = "2020-03-24T23:59:59.999Z",
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: phenomenonTimeA},
                                    {result: 2, phenomenonTime: phenomenonTimeB},
                                    {result: 3, phenomenonTime: phenomenonTimeC}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDate = dayjs(phenomenonTimeA).format("YYYY-MM-DD"),
                // the sum ist two times the result sum because onupdate is called twice in this function (total + last week)
                expectedValue = 12;

            api.updateTotal("thingId", "meansOfTransport", (date, value) => {
                lastFirstDate = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete");

            expect(lastFirstDate).to.equal(expectedDate);
            expect(lastValue).to.equal(expectedValue);
        });
        it("should call onupdate with a sum of all observations for the _1-Woche and _15-Min urls", () => {
            let lastDate = false,
                lastValue = false;
            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                phenomenonTimeB = "2020-03-23T12:14:30.123Z",
                phenomenonTimeC = "2020-03-24T23:59:59.999Z",
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        if (url.indexOf("_1-Woche") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "foo",
                                    Observations: [
                                        {result: 1, phenomenonTime: phenomenonTimeA},
                                        {result: 2, phenomenonTime: phenomenonTimeB}
                                    ]
                                }]
                            }]);
                        }
                        else if (url.indexOf("_15-Min") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "bar",
                                    Observations: [
                                        {result: 5, phenomenonTime: phenomenonTimeC}
                                    ]
                                }]
                            }]);
                        }
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDate = dayjs(phenomenonTimeA).format("YYYY-MM-DD"),
                expectedValue = 8;

            api.updateTotal("thingId", "meansOfTransport", (date, value) => {
                lastDate = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete");

            expect(lastDate).to.equal(expectedDate);
            expect(lastValue).to.equal(expectedValue);
        });
        it("should add any number received by observation.result via mqtt to the current sum and call onupdate", () => {
            let lastSum = false;

            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        if (url.indexOf("_1-Woche") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "foo",
                                    Observations: [
                                        {result: 1, phenomenonTime: phenomenonTimeA},
                                        {result: 2, phenomenonTime: phenomenonTimeA},
                                        {result: 3, phenomenonTime: phenomenonTimeA},
                                        {result: 4, phenomenonTime: phenomenonTimeA}
                                    ]
                                }]
                            }]);
                        }
                        else if (url.indexOf("_15-Min") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "bar",
                                    Observations: [
                                        {result: 5, phenomenonTime: phenomenonTimeA},
                                        {result: 6, phenomenonTime: phenomenonTimeA},
                                        {result: 7, phenomenonTime: phenomenonTimeA},
                                        {result: 8, phenomenonTime: phenomenonTimeA}
                                    ]
                                }]
                            }]);
                        }
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(bar)/Observations";

            api.setSubscriptionTopics({});

            api.updateTotal("thingId", "meansOfTransport", (date, value) => {
                lastSum = value;
            }, "onerror", "onstart", "oncomplete");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopic][0]({result: 9});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 10});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 11});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 12});

            expect(lastSum).to.equal(78);
        });
        it("should call onerror if no observation was found in http response", () => {
            let lastErrorMessage = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                wrongObservations: []
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi(false, false, {}, dummySensorThingsHttp, true, "noSingletonOpt");

            api.updateTotal("thingId", "meansOfTransport", "onupdate", (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete");

            expect(lastErrorMessage).to.be.a("string");
        });
        it("should call on error if a received observation via mqtt has no result key", () => {
            let lastErrorMessage = false;

            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: []
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations";

            api.updateTotal("thingId", "meansOfTransport", "onupdate", (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopic][0]({wrongResult: 1});

            expect(lastErrorMessage).to.be.a("string");
        });
    });

    describe("TrafficCountApi.updateWorkingDayAverage", () => {
        it("should call onupdate with the first found date and value", () => {
            let lastDate = false,
                lastValue = false;
            const holidays = ["newYearsDay"],
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: "2020-12-31T00:00:00.000Z"},
                                    {result: 2, phenomenonTime: "2021-01-01T00:00:00.000Z"},
                                    {result: 3, phenomenonTime: "2021-01-02T00:00:00.000Z"},
                                    {result: 4, phenomenonTime: "2021-01-03T00:00:00.000Z"},
                                    {result: 5, phenomenonTime: "2021-01-04T00:00:00.000Z"}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDate = dayjs("2020-12-31T00:00:00.000Z").format("YYYY-MM-DD"),
                expectedValue = 3;

            api.updateWorkingDayAverage("thingId", "meansOfTransport", 365, holidays, (date, value) => {
                lastDate = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete");

            expect(lastDate).to.equal(expectedDate);
            expect(lastValue).to.equal(expectedValue);
        });
    });

    describe("TrafficCountApi.updateHighestWorkloadDay", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedFrom = new Date("2020-01-01 00:00:00").toISOString(),
                expectedUntil = new Date("2021-01-01 00:00:00").toISOString(),
                expectedUrl = "https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_1-Tag';$expand=Observations($filter=phenomenonTime ge " + expectedFrom + " and phenomenonTime lt " + expectedUntil + ";$orderby=result DESC;$top=1))";

            api.updateHighestWorkloadDay("thingId", "meansOfTransport", "2020", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastUrl).to.equal(expectedUrl);
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with the found date and value", () => {
            let lastDate = false,
                lastValue = false;
            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: phenomenonTimeA}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDate = dayjs(phenomenonTimeA).format("YYYY-MM-DD"),
                expectedValue = 1;

            api.updateHighestWorkloadDay("thingId", "meansOfTransport", dayjs(phenomenonTimeA).format("YYYY"), (date, value) => {
                lastDate = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete");

            expect(lastDate).to.equal(expectedDate);
            expect(lastValue).to.equal(expectedValue);
        });
    });

    describe("TrafficCountApi.updateHighestWorkloadWeek", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedFrom = new Date("2020-01-01 00:00:00").toISOString(),
                expectedUntil = new Date("2021-01-01 00:00:00").toISOString();

            api.updateHighestWorkloadWeek("thingId", "meansOfTransport", "2020", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastUrl).to.equal("https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_1-Woche';$expand=Observations($filter=phenomenonTime ge " + expectedFrom + " and phenomenonTime lt " + expectedUntil + ";$orderby=result DESC;$top=1))");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with the found date and value", () => {
            let lastCalendarWeek = false,
                lastValue = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: "2020-03-22T00:00:00.000Z"}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedCalendarWeek = 12,
                expectedValue = 1;

            api.updateHighestWorkloadWeek("thingId", "meansOfTransport", "2020", (calendarWeek, value) => {
                lastCalendarWeek = calendarWeek;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete");

            expect(lastCalendarWeek).to.equal(expectedCalendarWeek);
            expect(lastValue).to.equal(expectedValue);
        });
    });

    describe("TrafficCountApi.updateHighestWorkloadMonth", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedFrom = new Date("2020-01-01 00:00:00").toISOString(),
                expectedUntil = new Date("2021-01-01 00:00:00").toISOString();

            api.updateHighestWorkloadMonth("thingId", "meansOfTransport", "2020", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastUrl).to.equal("https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_1-Tag';$expand=Observations($filter=phenomenonTime ge " + expectedFrom + " and phenomenonTime lt " + expectedUntil + "))");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with the best month and value of all received observations", () => {
            let lastMonth = false,
                lastValue = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: "2020-01-22T00:00:00.000Z"},
                                    {result: 2, phenomenonTime: "2020-02-22T00:00:00.000Z"},
                                    {result: 3, phenomenonTime: "2020-02-22T01:00:00.000Z"},
                                    {result: 4, phenomenonTime: "2020-02-22T02:00:00.000Z"},
                                    {result: 5, phenomenonTime: "2020-03-22T00:00:00.000Z"}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedMonth = "02",
                expectedValue = 9;

            api.updateHighestWorkloadMonth("thingId", "meansOfTransport", "2020", (date, value) => {
                lastMonth = date;
                lastValue = value;
            }, "onerror", "onstart", "oncomplete");

            expect(lastMonth).to.equal(expectedMonth);
            expect(lastValue).to.equal(expectedValue);
        });
    });

    describe("TrafficCountApi.updateDataset", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedFrom = new Date("2020-03-20 00:00:00.000").toISOString(),
                expectedUntil = new Date("2020-03-21 00:00:00.000").toISOString(),
                timeSettings = {
                    interval: "interval",
                    from: "2020-03-20",
                    until: "2020-03-20"
                };

            api.updateDataset("thingId", "meansOfTransport", timeSettings, "onupdate", "onerror", "onstart", "oncomplete", "todayUntilOpt");

            expect(lastUrl).to.equal("https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_interval';$expand=Observations($filter=phenomenonTime ge " + expectedFrom + " and phenomenonTime le " + expectedUntil + ";$orderby=phenomenonTime asc))");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should call onupdate with a dataset generated out of the found observations without subscription if until does not equal todays date", () => {
            let lastDataset = false;
            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                phenomenonTimeB = "2020-03-23T12:14:30.123Z",
                phenomenonTimeC = "2020-03-24T23:59:59.999Z",
                expectedDateTimeA = dayjs(phenomenonTimeA).format("YYYY-MM-DD HH:mm:ss"),
                expectedDateTimeB = dayjs(phenomenonTimeB).format("YYYY-MM-DD HH:mm:ss"),
                expectedDateTimeC = dayjs(phenomenonTimeC).format("YYYY-MM-DD HH:mm:ss"),
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: phenomenonTimeA},
                                    {result: 2, phenomenonTime: phenomenonTimeB},
                                    {result: 3, phenomenonTime: phenomenonTimeC}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedDataset = {
                    meansOfTransport: {}
                },
                timeSettings = {
                    interval: "interval",
                    from: "2020-03-20",
                    until: "2020-03-20"
                };

            expectedDataset.meansOfTransport[expectedDateTimeA] = 1;
            expectedDataset.meansOfTransport[expectedDateTimeB] = 2;
            expectedDataset.meansOfTransport[expectedDateTimeC] = 3;

            api.updateDataset("thingId", "meansOfTransport", timeSettings, (dataset) => {
                lastDataset = dataset;
            }, "onerror", "onstart", "oncomplete", "todayUntilOpt");

            expect(lastDataset).to.deep.equal(expectedDataset);
        });
        it("should subscribe via mqtt retain 2 if param until equals today", () => {
            let lastTopic = false,
                lastMqttOptions = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: []
                            }]
                        }]);
                    }
                },
                dummySensorThingsMqtt = {
                    subscribe: (topic, mqttOptions) => {
                        lastTopic = topic;
                        lastMqttOptions = mqttOptions;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {host: "foobar"}, dummySensorThingsHttp, dummySensorThingsMqtt, "noSingletonOpt"),
                timeSettings = {
                    interval: "interval",
                    from: "2020-03-20",
                    until: "2020-03-20"
                };

            // hint: until === todayUntilOpt with "until" === "today"
            api.updateDataset("thingId", "meansOfTransport", timeSettings, "onupdate", "onerror", "onstart", "oncomplete", "2020-03-20");

            expect(lastTopic).to.equal("v1234/Datastreams(foo)/Observations");
            expect(lastMqttOptions).to.deep.equal({rh: 2});
        });
        it("should resend the result with new data to onupdate anytime a subscribed message was received", () => {
            let lastDataset = false;

            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                phenomenonTimeB = "2020-03-23T12:14:30.123Z",
                phenomenonTimeC = "2020-03-24T23:59:59.999Z",
                expectedDateTimeA = dayjs(phenomenonTimeA).format("YYYY-MM-DD HH:mm:ss"),
                expectedDateTimeB = dayjs(phenomenonTimeB).format("YYYY-MM-DD HH:mm:ss"),
                expectedDateTimeC = dayjs(phenomenonTimeC).format("YYYY-MM-DD HH:mm:ss"),
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: phenomenonTimeA}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations",
                expectedDataset = {
                    meansOfTransport: {}
                },
                timeSettings = {
                    interval: "interval",
                    from: "2020-03-20",
                    until: "2020-03-20"
                };

            expectedDataset.meansOfTransport[expectedDateTimeA] = 1;
            expectedDataset.meansOfTransport[expectedDateTimeB] = 2;
            expectedDataset.meansOfTransport[expectedDateTimeC] = 3;

            api.setSubscriptionTopics({});

            // hint: until === todayUntilOpt with "until" === "today"
            api.updateDataset("thingId", "meansOfTransport", timeSettings, (dataset) => {
                lastDataset = dataset;
            }, "onerror", "onstart", "oncomplete", "2020-03-20");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopic][0]({result: 2, phenomenonTime: phenomenonTimeB});
            api.getSubscriptionTopics()[expectedTopic][0]({result: 3, phenomenonTime: phenomenonTimeC});

            expect(lastDataset).to.deep.equal(expectedDataset);
        });

        // search for "trafficCountSVAktivierung" to find all lines of code to switch Kfz to Kfz + SV
        // use this code to test Kfz + SV
        /*
        it("should add Anzahl_SV data to dataset if meansOfTransport equals 'Anzahl_Kfz'; should resend data anytime a subscribed message was received", () => {
            let lastDataset = false;

            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                phenomenonTimeB = "2020-03-23T12:14:30.123Z",
                phenomenonTimeC = "2020-03-24T23:59:59.999Z",
                expectedDateTimeA = dayjs(phenomenonTimeA).format("YYYY-MM-DD HH:mm:ss"),
                expectedDateTimeB = dayjs(phenomenonTimeB).format("YYYY-MM-DD HH:mm:ss"),
                expectedDateTimeC = dayjs(phenomenonTimeC).format("YYYY-MM-DD HH:mm:ss"),
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        if (url.indexOf("Anzahl_Kfz") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "foo",
                                    Observations: [
                                        {result: 1000, phenomenonTime: phenomenonTimeA}
                                    ]
                                }]
                            }]);
                        }
                        else if (url.indexOf("Anzahl_SV") !== -1) {
                            onupdate([{
                                Datastreams: [{
                                    "@iot.id": "bar",
                                    Observations: [
                                        {result: 1, phenomenonTime: phenomenonTimeA}
                                    ]
                                }]
                            }]);
                        }
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                meansOfTransport = "Anzahl_Kfz",
                expectedTopicFahrzeuge = "v1234/Datastreams(foo)/Observations",
                expectedTopicSV = "v1234/Datastreams(bar)/Observations",
                expectedOutcome = {
                    Anzahl_Kfz: {},
                    Anzahl_SV: {}
                },
                timeSettings = {
                    interval: "interval",
                    from: "2020-03-20",
                    until: "2020-03-20"
                };

            api.setSubscriptionTopics({});

            // hint: until === todayUntilOpt with "until" === "today"
            api.updateDataset("thingId", meansOfTransport, timeSettings, (dataset) => {
                lastDataset = dataset;
            }, "onerror", "onstart", "oncomplete", "2020-03-20");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopicFahrzeuge)).to.be.true;
            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopicSV)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopicFahrzeuge]).to.be.an("array").that.is.not.empty;
            expect(api.getSubscriptionTopics()[expectedTopicSV]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopicFahrzeuge][0] === "function").to.be.true;
            expect(typeof api.getSubscriptionTopics()[expectedTopicSV][0] === "function").to.be.true;

            // stimulate subscription handler
            api.getSubscriptionTopics()[expectedTopicFahrzeuge][0]({result: 2000, phenomenonTime: phenomenonTimeB});
            expectedOutcome.Anzahl_Kfz[expectedDateTimeA] = 1000;
            expectedOutcome.Anzahl_Kfz[expectedDateTimeB] = 2000;
            expectedOutcome.Anzahl_SV[expectedDateTimeA] = 1;
            expect(lastDataset).to.deep.equal(expectedOutcome);

            api.getSubscriptionTopics()[expectedTopicSV][0]({result: 2, phenomenonTime: expectedDateTimeC});
            expectedOutcome.Anzahl_SV[expectedDateTimeC] = 2;
            expect(lastDataset).to.deep.equal(expectedOutcome);
        });
         */
    });

    describe("TrafficCountApi.subscribeLastUpdate", () => {
        it("should build a correct url and call it via given http dummy", () => {
            let lastOnupdate = false,
                lastOnstart = false,
                lastOncomplete = false,
                lastOnerror = false,
                lastUrl = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate, onstart, oncomplete, onerror) => {
                        lastUrl = url;
                        lastOnupdate = onupdate;
                        lastOnstart = onstart;
                        lastOncomplete = oncomplete;
                        lastOnerror = onerror;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt");

            api.subscribeLastUpdate("thingId", "meansOfTransport", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastUrl).to.equal("https://www.example.com/v1234/Things(thingId)?$expand=Datastreams($filter=properties/layerName eq 'meansOfTransport" + api.getLayerNameInfix() + "_15-Min')");
            expect(typeof lastOnupdate === "function").to.be.true;
            expect(lastOnerror).to.equal("onerror");
            expect(lastOnstart).to.equal("onstart");
            expect(lastOncomplete).to.equal("oncomplete");
        });
        it("should create a new subscription topic", () => {
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo"
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations";

            api.setSubscriptionTopics({});
            api.subscribeLastUpdate("thingId", "meansOfTransport", "onupdate", "onerror", "onstart", "oncomplete");

            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
        });
        it("should subscribe to a subscription topic with mqtt options rh 0", () => {
            let lastTopic = false,
                lastMqttOptions = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo"
                            }]
                        }]);
                    }
                },
                dummySensorThingsMqtt = {
                    subscribe: (topic, mqttOptions) => {
                        lastTopic = topic;
                        lastMqttOptions = mqttOptions;
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {host: "foobar"}, dummySensorThingsHttp, dummySensorThingsMqtt, "noSingletonOpt");

            api.subscribeLastUpdate("thingId", "meansOfTransport", "onupdate", "onerror", "onstart", "oncomplete");

            expect(lastTopic).to.equal("v1234/Datastreams(foo)/Observations");
            expect(lastMqttOptions).to.deep.equal({rh: 0});
        });
        it("should push an event to subscriptionTopics that will hand over resultTime to the given onupdate handler", () => {
            let lastDatetime = false,
                lastErrorMessage = false;
            const resultTimeA = "2020-03-22T00:00:00.000Z",
                expectedDateTimeA = dayjs(resultTimeA).format("YYYY-MM-DD HH:mm:ss"),
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo"
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                expectedTopic = "v1234/Datastreams(foo)/Observations";

            api.setSubscriptionTopics({});
            api.subscribeLastUpdate("thingId", "meansOfTransport", (datetime) => {
                lastDatetime = datetime;
            }, "onerror", "onstart", "oncomplete");
            expect(Object.prototype.hasOwnProperty.call(api.getSubscriptionTopics(), expectedTopic)).to.be.true;
            expect(api.getSubscriptionTopics()[expectedTopic]).to.be.an("array").that.is.not.empty;
            expect(typeof api.getSubscriptionTopics()[expectedTopic][0] === "function").to.be.true;
            api.getSubscriptionTopics()[expectedTopic][0]({
                resultTime: resultTimeA
            });
            expect(lastDatetime).to.equal(expectedDateTimeA);

            lastDatetime = false;
            api.setSubscriptionTopics({});
            api.subscribeLastUpdate("thingId", "meansOfTransport", (datetime) => {
                lastDatetime = datetime;
            }, (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete");
            api.getSubscriptionTopics()[expectedTopic][0]({
                wrongResultTime: "foo"
            });
            expect(lastDatetime).to.be.false;
            expect(lastErrorMessage).to.be.a("string");
        });

        it("should call onerror if no Datastream with a @iot.id was found in payload", () => {
            let lastErrorMessage = false;
            const dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        onupdate([{
                            Datastreams: [{
                                "wrong@iot.id": "foo"
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt");

            api.setSubscriptionTopics({});
            api.subscribeLastUpdate("thingId", "meansOfTransport", "onupdate", (error) => {
                lastErrorMessage = error;
            }, "onstart", "oncomplete");

            expect(api.getSubscriptionTopics()).to.be.empty;
            expect(lastErrorMessage).to.be.a("string");
        });
    });

    describe("TrafficCountApi.unsubscribeEverything", () => {
        it("should empty subscription topics", () => {
            const api = new TrafficCountApi(false, false, {}, true, true, "noSingletonOpt");

            api.setSubscriptionTopics({
                foo: "bar",
                baz: "qox"
            });

            api.unsubscribeEverything();

            expect(api.getSubscriptionTopics()).to.be.empty;
        });
        it("should call unsubscribe on the given mqtt client for each topic found in subscription topics", () => {
            const unsubscribedTopics = [],
                dummySensorThingsMqtt = {
                    unsubscribe: (topic) => {
                        unsubscribedTopics.push(topic);
                    }
                },
                api = new TrafficCountApi(false, false, {}, true, dummySensorThingsMqtt, "noSingletonOpt");

            api.setSubscriptionTopics({
                foo: "bar",
                baz: "qox"
            });

            api.unsubscribeEverything();

            expect(unsubscribedTopics).to.be.an("array").to.deep.equal(["foo", "baz"]);
        });
        it("should call onsuccess after unsubscribing everything topic found in subscription topics", () => {
            let onsuccessCalled = false;
            const api = new TrafficCountApi(false, false, {}, true, true, "noSingletonOpt");

            api.unsubscribeEverything(() => {
                onsuccessCalled = true;
            });

            expect(onsuccessCalled).to.be.true;
        });
    });

    describe("downloadData", () => {
        it("should receive a resultset with title and data", () => {
            let lastResult = false;
            const phenomenonTimeA = "2020-03-22T00:00:00.000Z",
                phenomenonTimeB = "2020-03-23T12:14:30.123Z",
                phenomenonTimeC = "2020-03-24T23:59:59.999Z",
                dummySensorThingsHttp = {
                    get: (url, onupdate) => {
                        if (url === "https://www.example.com/v1234/Things(thingId)") {
                            // updateTitle
                            onupdate([{
                                name: "title"
                            }]);
                            return;
                        }

                        onupdate([{
                            Datastreams: [{
                                "@iot.id": "foo",
                                Observations: [
                                    {result: 1, phenomenonTime: phenomenonTimeA},
                                    {result: 2, phenomenonTime: phenomenonTimeB},
                                    {result: 3, phenomenonTime: phenomenonTimeC}
                                ]
                            }]
                        }]);
                    }
                },
                api = new TrafficCountApi("https://www.example.com", "v1234", {}, dummySensorThingsHttp, true, "noSingletonOpt"),
                timeSettings = {
                    interval: "interval",
                    from: "2020-03-20",
                    until: "2020-03-30"
                };

            api.downloadData("thingId", "meansOfTransport", timeSettings, result => {
                lastResult = result;
            }, "onerror", "onstart", "oncomplete");

            expect(lastResult).to.be.an("object");
            expect(lastResult.title).to.equal("title");
            expect(lastResult.data).to.be.an("object");
            expect(lastResult.data.meansOfTransport).to.be.an("object");
            expect(lastResult.data.meansOfTransport["2020-03-22 01:00:00"]).to.equal(1);
            expect(lastResult.data.meansOfTransport["2020-03-23 13:14:30"]).to.equal(2);
            expect(lastResult.data.meansOfTransport["2020-03-25 00:59:59"]).to.equal(3);
        });
    });
});
