'use strict';

describe('AppointmentsListViewController', function () {
    var controller, scope, stateparams, spinner, appointmentsService, appService, appDescriptor, _appointmentsFilter,
        printer, confirmBox, $translate, $state;

    beforeEach(function () {
        module('bahmni.appointments');
        inject(function ($controller, $rootScope, $stateParams, $httpBackend) {
            scope = $rootScope.$new();
            controller = $controller;
            stateparams = $stateParams;
            _appointmentsFilter = jasmine.createSpy('appointmentsFilter');
            appointmentsService = jasmine.createSpyObj('appointmentsService', ['getAllAppointments', 'changeStatus', 'undoCheckIn']);
            appointmentsService.getAllAppointments.and.returnValue(specUtil.simplePromise({}));
            appService = jasmine.createSpyObj('appService', ['getAppDescriptor']);
            appDescriptor = jasmine.createSpyObj('appDescriptor', ['getConfigValue']);
            printer = jasmine.createSpyObj('printer', ['print']);
            appService.getAppDescriptor.and.returnValue(appDescriptor);
            appDescriptor.getConfigValue.and.returnValue(true);
            spinner = jasmine.createSpyObj('spinner', ['forPromise']);
            spinner.forPromise.and.callFake(function () {
                return {
                    then: function () {
                        return {};
                    }
                };
            });
            $state = jasmine.createSpyObj('$state', ['go']);
            confirmBox = jasmine.createSpy('confirmBox');
            $translate = jasmine.createSpyObj('$translate', ['instant', 'storageKey', 'storage', 'preferredLanguage']);
            $httpBackend.expectGET('../i18n/appointments/locale_en.json').respond('<div></div>');
            $httpBackend.expectGET('/bahmni_config/openmrs/i18n/appointments/locale_en.json').respond('<div></div>');
            $httpBackend.expectGET('/openmrs/ws/rest/v1/provider').respond('<div></div>');
        });
    });

    var createController = function () {
        controller('AppointmentsListViewController', {
            $scope: scope,
            spinner: spinner,
            appointmentsService: appointmentsService,
            appService: appService,
            $stateParams: stateparams,
            appointmentsFilter: _appointmentsFilter,
            printer: printer,
            $translate: $translate,
            confirmBox: confirmBox,
            $state: $state
        });
    };

    it("should initialize today's date if not viewDate is provided in stateParams", function () {
        createController();
        var today = moment().startOf('day').toDate();
        expect(scope.startDate).toEqual(today);
    });

    it('should initialize to viewDate in stateParams if provided', function () {
        stateparams = {
            viewDate: moment("2017-08-20").toDate()
        };
        createController();
        expect(scope.startDate).toEqual(stateparams.viewDate);
    });

    it("should initialize enable service types and enable specialities from config", function () {
        createController();
        expect(scope.enableServiceTypes).toBeTruthy();
        expect(scope.enableSpecialities).toBeTruthy();
    });

    it('should initialize searchedPatient as true if search enabled and patient exists ', function () {
        stateparams = {
            isSearchEnabled: true,
            patient: {name: 'Test patient', uuid: 'patientUuid'}
        };
        createController();
        expect(scope.searchedPatient).toBeTruthy();
    });

    it('should get appointments for the date if searchedPatient is false', function () {
        stateparams = {
            isSearchEnabled: false,
            patient: {name: 'Test patient', uuid: 'patientUuid'}
        };
        createController();
        expect(appointmentsService.getAllAppointments).toHaveBeenCalledWith({forDate: moment().startOf('day').toDate()});
        expect(spinner.forPromise).toHaveBeenCalled();
    });

    it('should not get appointments for the date if searchedPatient is true', function () {
        stateparams = {
            isSearchEnabled: true,
            patient: {name: 'Test patient', uuid: 'patientUuid'}
        };
        createController();
        expect(appointmentsService.getAllAppointments).not.toHaveBeenCalled();
        expect(spinner.forPromise).not.toHaveBeenCalled();
    });

    it('should get appointments for date', function () {
        createController();
        var viewDate = new Date('1970-01-01T11:30:00.000Z');
        scope.getAppointmentsForDate(viewDate);
        expect(stateparams.viewDate).toEqual(viewDate);
        expect(appointmentsService.getAllAppointments).toHaveBeenCalledWith({forDate: viewDate});
        expect(appointmentsService.selectedAppointment).toBeUndefined();
        expect(spinner.forPromise).toHaveBeenCalled();
    });

    it('should select an appointment', function () {
        createController();
        var appointment1 = {patient: {name: 'patient1'}};
        var appointment2 = {patient: {name: 'patient2'}};
        scope.appointments = [appointment1, appointment2];
        scope.select(appointment2);
        expect(scope.selectedAppointment).toBe(appointment2);
        expect(scope.isSelected(scope.appointments[0])).toBeFalsy();
        expect(scope.isSelected(scope.appointments[1])).toBeTruthy();
    });

    it('should unselect an appointment if is selected', function () {
        createController();
        var appointment1 = {patient: {name: 'patient1'}};
        var appointment2 = {patient: {name: 'patient2'}};
        scope.appointments = [appointment1, appointment2];
        scope.select(appointment2);
        expect(scope.selectedAppointment).toBe(appointment2);
        expect(scope.isSelected(scope.appointments[1])).toBeTruthy();
        scope.select(appointment2);
        expect(scope.selectedAppointment).toBeUndefined();
        expect(scope.isSelected(scope.appointments[1])).toBeFalsy();
    });

    it("should filter appointments on loading list view", function () {
        _appointmentsFilter.and.callFake(function (data) {
            return [appointments[0]];
        });
        var appointments = [{
            "uuid": "347ae565-be21-4516-b573-103f9ce84a20",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203006",
                "name": "patient name",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 4,
                "name": "Ophthalmology",
                "description": "",
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": 10,
                "location": {},
                "uuid": "02666cc6-5f3e-4920-856d-ab7e28d3dbdb",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": null,
            "location": null,
            "startDateTime": 1503891000000,
            "endDateTime": 1503900900000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }, {
            "uuid": "348d8416-58e1-48a4-b7db-44261c4d1798",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203006",
                "name": "patient name",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 5,
                "name": "Cardiology",
                "description": null,
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": null,
                "location": {},
                "uuid": "2049ddaa-1287-450e-b4a3-8f523b072827",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": null,
            "location": null,
            "startDateTime": 1503887400000,
            "endDateTime": 1503889200000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }, {
            "uuid": "8f895c2d-130d-4e12-a621-7cb6c16a2095",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203006",
                "name": "patient name",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 5,
                "name": "Cardiology",
                "description": null,
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": null,
                "location": {},
                "uuid": "2049ddaa-1287-450e-b4a3-8f523b072827",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": {"name": "Super Man", "uuid": "c1c26908-3f10-11e4-adec-0800271c1b75"},
            "location": null,
            "startDateTime": 1503923400000,
            "endDateTime": 1503925200000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }];
        appointmentsService.getAllAppointments.and.returnValue(specUtil.simplePromise({data: appointments}));
        stateparams.filterParams = {serviceUuids: ["02666cc6-5f3e-4920-856d-ab7e28d3dbdb"]};
        createController();
        expect(scope.appointments).toBe(appointments);
        expect(scope.filteredAppointments.length).toEqual(1);
        expect(scope.filteredAppointments[0]).toEqual(appointments[0]);
    });
    it("should display seached patient appointment history", function () {
        var appointments = [{
            "uuid": "347ae565-be21-4516-b573-103f9ce84a20",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203006",
                "name": "patient name",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 4,
                "name": "Ophthalmology",
                "description": "",
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": 10,
                "location": {},
                "uuid": "02666cc6-5f3e-4920-856d-ab7e28d3dbdb",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": null,
            "location": null,
            "startDateTime": 1503891000000,
            "endDateTime": 1503900900000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }, {
            "uuid": "348d8416-58e1-48a4-b7db-44261c4d1798",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203006",
                "name": "patient name",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 5,
                "name": "Cardiology",
                "description": null,
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": null,
                "location": {},
                "uuid": "2049ddaa-1287-450e-b4a3-8f523b072827",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": null,
            "location": null,
            "startDateTime": 1503887400000,
            "endDateTime": 1503889200000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }, {
            "uuid": "8f895c2d-130d-4e12-a621-7cb6c16a2095",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203003",
                "name": "John Smith",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 5,
                "name": "Cardiology",
                "description": null,
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": null,
                "location": {},
                "uuid": "2049ddaa-1287-450e-b4a3-8f523b072827",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": {"name": "Super Man", "uuid": "c1c26908-3f10-11e4-adec-0800271c1b75"},
            "location": null,
            "startDateTime": 1503923400000,
            "endDateTime": 1503925200000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }];
        appointmentsService.getAllAppointments.and.returnValue(specUtil.simplePromise({data: appointments}));
        stateparams = {
            isFilterOpen: true,
            isSearchEnabled: false
        };
        createController();
        expect(scope.appointments).toBe(appointments);
        expect(scope.searchedPatient).toBeFalsy();
        scope.displaySearchedPatient([appointments[1]]);
        expect(scope.filteredAppointments.length).toEqual(1);
        expect(scope.searchedPatient).toBeTruthy();
        expect(stateparams.isFilterOpen).toBeFalsy();
        expect(stateparams.isSearchEnabled).toBeTruthy();
    });
    describe("goBackToPreviousView", function () {
        var appointments;
        beforeEach(function () {
            appointments = [{
                "uuid": "347ae565-be21-4516-b573-103f9ce84a20",
                "appointmentNumber": "0000",
                "patient": {
                    "identifier": "GAN203006",
                    "name": "patient name",
                    "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
                },
                "service": {
                    "appointmentServiceId": 4,
                    "name": "Ophthalmology",
                    "description": "",
                    "speciality": {},
                    "startTime": "",
                    "endTime": "",
                    "maxAppointmentsLimit": null,
                    "durationMins": 10,
                    "location": {},
                    "uuid": "02666cc6-5f3e-4920-856d-ab7e28d3dbdb",
                    "color": "#006400",
                    "creatorName": null
                },
                "serviceType": null,
                "provider": null,
                "location": null,
                "startDateTime": 1503891000000,
                "endDateTime": 1503900900000,
                "appointmentKind": "Scheduled",
                "status": "Scheduled",
                "comments": null
            }, {
                "uuid": "348d8416-58e1-48a4-b7db-44261c4d1798",
                "appointmentNumber": "0000",
                "patient": {
                    "identifier": "GAN203006",
                    "name": "patient name",
                    "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
                },
                "service": {
                    "appointmentServiceId": 5,
                    "name": "Cardiology",
                    "description": null,
                    "speciality": {},
                    "startTime": "",
                    "endTime": "",
                    "maxAppointmentsLimit": null,
                    "durationMins": null,
                    "location": {},
                    "uuid": "2049ddaa-1287-450e-b4a3-8f523b072827",
                    "color": "#006400",
                    "creatorName": null
                },
                "serviceType": null,
                "provider": null,
                "location": null,
                "startDateTime": 1503887400000,
                "endDateTime": 1503889200000,
                "appointmentKind": "Scheduled",
                "status": "Scheduled",
                "comments": null
            }, {
                "uuid": "8f895c2d-130d-4e12-a621-7cb6c16a2095",
                "appointmentNumber": "0000",
                "patient": {
                    "identifier": "GAN203003",
                    "name": "John Smith",
                    "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
                },
                "service": {
                    "appointmentServiceId": 5,
                    "name": "Cardiology",
                    "description": null,
                    "speciality": {},
                    "startTime": "",
                    "endTime": "",
                    "maxAppointmentsLimit": null,
                    "durationMins": null,
                    "location": {},
                    "uuid": "2049ddaa-1287-450e-b4a3-8f523b072827",
                    "color": "#006400",
                    "creatorName": null
                },
                "serviceType": null,
                "provider": {"name": "Super Man", "uuid": "c1c26908-3f10-11e4-adec-0800271c1b75"},
                "location": null,
                "startDateTime": 1503923400000,
                "endDateTime": 1503925200000,
                "appointmentKind": "Scheduled",
                "status": "Scheduled",
                "comments": null
            }];
            appointmentsService.getAllAppointments.and.returnValue(specUtil.simplePromise({data: appointments}));
        });
        it("should reset filtered appointments to its previous data", function () {
            createController();
            scope.filteredAppointments = appointments;
            scope.displaySearchedPatient([appointments[1]]);
            expect(scope.filteredAppointments.length).toEqual(1);
            scope.goBackToPreviousView();
            expect(scope.filteredAppointments.length).toEqual(3);
            expect(scope.searchedPatient).toBeFalsy();
            expect(stateparams.isFilterOpen).toBeTruthy();
            expect(stateparams.isSearchEnabled).toBeFalsy();
        });
        it("should sort appointments by the sort column", function () {
            scope.filterParams = {
                providerUuids: [],
                serviceUuids: [],
                serviceTypeUuids: [],
                statusList: []
            };
            var appointment1 = {
                patient: {name: 'patient2', identifier: "IQ00001"},
                comments: "comments1",
                status: "Completed",
                appointmentKind: "Completed",
                provider: {name: "provider1"},
                endDateTime: 100000,
                startDateTime: 200000,
                service: {
                    name: "service1",
                    serviceType: {name: "type1"},
                    speciality: {name: "speciality1"},
                    location: {name: "location1"}
                }
            };
            var appointment2 = {
                patient: {name: 'patient1', identifier: "IQ00002"},
                comments: "comments2",
                status: "Scheduled",
                appointmentKind: "Scheduled",
                provider: {name: "provider2"},
                endDateTime: 200000,
                startDateTime: 300000,
                service: {
                    name: "service2",
                    serviceType: {name: "type2"},
                    speciality: {name: "speciality2"},
                    location: {name: "location2"}
                }
            };
            var appointments = [appointment1, appointment2];
            appointmentsService.getAllAppointments.and.returnValue(specUtil.simplePromise({data: appointments}));
            createController();
            scope.sortAppointmentsBy('patient.name');
            expect(scope.sortColumn).toEqual('patient.name');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].patient.name).toEqual("patient2");
            expect(scope.appointments[1].patient.name).toEqual("patient1");

            scope.sortAppointmentsBy('comments');
            expect(scope.sortColumn).toEqual('comments');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].comments).toEqual("comments1");
            expect(scope.appointments[1].comments).toEqual("comments2");

            scope.sortAppointmentsBy('status');
            expect(scope.sortColumn).toEqual('status');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].status).toEqual("Completed");
            expect(scope.appointments[1].status).toEqual("Scheduled");

            scope.sortAppointmentsBy('patient.identifier');
            expect(scope.sortColumn).toEqual('patient.identifier');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].patient.identifier).toEqual("IQ00001");
            expect(scope.appointments[1].patient.identifier).toEqual("IQ00002");

            scope.sortAppointmentsBy('provider.name');
            expect(scope.sortColumn).toEqual('provider.name');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].provider.name).toEqual("provider1");
            expect(scope.appointments[1].provider.name).toEqual("provider2");

            scope.sortAppointmentsBy('service.location.name');
            expect(scope.sortColumn).toEqual('service.location.name');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].service.location.name).toEqual("location1");
            expect(scope.appointments[1].service.location.name).toEqual("location2");

            scope.sortAppointmentsBy('service.serviceType.name');
            expect(scope.sortColumn).toEqual('service.serviceType.name');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].service.serviceType.name).toEqual("type1");
            expect(scope.appointments[1].service.serviceType.name).toEqual("type2");

            scope.sortAppointmentsBy('service.name');
            expect(scope.sortColumn).toEqual('service.name');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].service.name).toEqual("service1");
            expect(scope.appointments[1].service.name).toEqual("service2");

            scope.sortAppointmentsBy('endDateTime');
            expect(scope.sortColumn).toEqual('endDateTime');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].endDateTime).toEqual(100000);
            expect(scope.appointments[1].endDateTime).toEqual(200000);

            scope.sortAppointmentsBy('startDateTime');
            expect(scope.sortColumn).toEqual('startDateTime');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].startDateTime).toEqual(200000);
            expect(scope.appointments[1].startDateTime).toEqual(300000);
        });

        it("should reverse sort appointments if sorted on the same column consecutively", function () {
            scope.filterParams = {
                providerUuids: [],
                serviceUuids: [],
                serviceTypeUuids: [],
                statusList: []
            };
            var appointment1 = {
                patient: {name: 'patient2', identifier: "IQ00001"},
                comments: "comments1",
                status: "Completed",
                appointmentKind: "Completed",
                provider: {name: "provider1"},
                endDateTime: 100000,
                startDateTime: 200000,
                service: {
                    name: "service1",
                    serviceType: {name: "type1"},
                    speciality: {name: "speciality1"},
                    location: {name: "location1"}
                }
            };
            var appointment2 = {
                patient: {name: 'patient1', identifier: "IQ00002"},
                comments: "comments2",
                status: "Scheduled",
                appointmentKind: "Scheduled",
                provider: {name: "provider2"},
                endDateTime: 200000,
                startDateTime: 300000,
                service: {
                    name: "service2",
                    serviceType: {name: "type2"},
                    speciality: {name: "speciality2"},
                    location: {name: "location2"}
                }
            };
            var appointments = [appointment1, appointment2];
            appointmentsService.getAllAppointments.and.returnValue(specUtil.simplePromise({data: appointments}));
            createController();
            scope.sortAppointmentsBy('patient.name');
            expect(scope.reverseSort).toEqual(true);
            expect(scope.sortColumn).toEqual('patient.name');
            expect(scope.appointments.length).toEqual(2);
            expect(scope.appointments[0].patient.name).toEqual("patient2");
            expect(scope.appointments[1].patient.name).toEqual("patient1");

            it("should have table info", function () {
                var tableInfo = [{heading: 'APPOINTMENT_PATIENT_ID', sortInfo: 'patient.identifier', enable: true},
                    {heading: 'APPOINTMENT_PATIENT_NAME', sortInfo: 'patient.name', class: true, enable: true},
                    {heading: 'APPOINTMENT_DATE', sortInfo: 'appointmentDate', enable: true},
                    {heading: 'APPOINTMENT_START_TIME_KEY', sortInfo: 'startDateTime', enable: true},
                    {heading: 'APPOINTMENT_END_TIME_KEY', sortInfo: 'endDateTime', enable: true},
                    {heading: 'APPOINTMENT_PROVIDER', sortInfo: 'provider.name', class: true, enable: true},
                    {
                        heading: 'APPOINTMENT_SERVICE_SPECIALITY_KEY',
                        sortInfo: 'service.speciality.name',
                        enable: scope.enableSpecialities
                    },
                    {heading: 'APPOINTMENT_SERVICE', sortInfo: 'service.name', enable: true},
                    {
                        heading: 'APPOINTMENT_SERVICE_TYPE_FULL',
                        sortInfo: 'service.serviceType.name',
                        class: true,
                        enable: scope.enableServiceTypes
                    },
                    {heading: 'APPOINTMENT_WALK_IN', sortInfo: 'appointmentKind', enable: true},
                    {
                        heading: 'APPOINTMENT_SERVICE_LOCATION_KEY',
                        sortInfo: 'service.location.name',
                        class: true,
                        enable: true
                    },
                    {heading: 'APPOINTMENT_STATUS', sortInfo: 'status', enable: true},
                    {heading: 'APPOINTMENT_CREATE_NOTES', sortInfo: 'comments', enable: true}];
                createController();
                expect(scope.tableInfo).toEqual(tableInfo);
            });

            it('should filter the appointments on change of filter params', function () {
                _appointmentsFilter.and.callFake(function (data) {
                    return data;
                });
                var appointment1 = {
                    patient: {name: 'patient2', identifier: "IQ00001"},
                    comments: "comments1",
                    status: "Completed",
                    appointmentKind: "Completed",
                    provider: {name: "provider1"},
                    endDateTime: 100000,
                    startDateTime: 200000,
                    service: {
                        name: "service1",
                        serviceType: {name: "type1"},
                        speciality: {name: "speciality1"},
                        location: {name: "location1"}
                    }
                };
                var appointment2 = {
                    patient: {name: 'patient1', identifier: "IQ00002"},
                    comments: "comments2",
                    status: "Scheduled",
                    appointmentKind: "Scheduled",
                    provider: {name: "provider2"},
                    endDateTime: 200000,
                    startDateTime: 300000,
                    service: {
                        name: "service2",
                        serviceType: {name: "type2"},
                        speciality: {name: "speciality2"},
                        location: {name: "location2"}
                    }
                };
                scope.appointments = [appointment1, appointment2];
                stateparams.filterParams = {};
                scope.$digest();
                stateparams.filterParams = {serviceUuids: ['serviceUuid']};
                scope.$digest();
                expect(_appointmentsFilter.calls.mostRecent().args[0]).toEqual(scope.appointments);
                expect(_appointmentsFilter.calls.mostRecent().args[1]).toEqual(stateparams.filterParams);
                scope.sortAppointmentsBy('patient.identifier');
                expect(scope.reverseSort).toEqual(false);
                expect(scope.sortColumn).toEqual('patient.identifier');
                expect(scope.appointments.length).toEqual(2);
                expect(scope.appointments[0].patient.identifier).toEqual("IQ00001");
                expect(scope.appointments[1].patient.identifier).toEqual("IQ00002");
            });

            it("should have table info", function () {
                var tableInfo = [{heading: 'APPOINTMENT_PATIENT_ID', sortInfo: 'patient.identifier', enable: true},
                    {heading: 'APPOINTMENT_PATIENT_NAME', sortInfo: 'patient.name', class: true, enable: true},
                    {heading: 'APPOINTMENT_DATE', sortInfo: 'appointmentDate', enable: true},
                    {heading: 'APPOINTMENT_START_TIME_KEY', sortInfo: 'startDateTime', enable: true},
                    {heading: 'APPOINTMENT_END_TIME_KEY', sortInfo: 'endDateTime', enable: true},
                    {heading: 'APPOINTMENT_PROVIDER', sortInfo: 'provider.name', class: true, enable: true},
                    {
                        heading: 'APPOINTMENT_SERVICE_SPECIALITY_KEY',
                        sortInfo: 'service.speciality.name',
                        enable: scope.enableSpecialities
                    },
                    {heading: 'APPOINTMENT_SERVICE', sortInfo: 'service.name', enable: true},
                    {
                        heading: 'APPOINTMENT_SERVICE_TYPE_FULL',
                        sortInfo: 'service.serviceType.name',
                        class: true,
                        enable: scope.enableServiceTypes
                    },
                    {heading: 'APPOINTMENT_WALK_IN', sortInfo: 'appointmentKind', enable: true},
                    {
                        heading: 'APPOINTMENT_SERVICE_LOCATION_KEY',
                        sortInfo: 'service.location.name',
                        class: true,
                        enable: true
                    },
                    {heading: 'APPOINTMENT_STATUS', sortInfo: 'status', enable: true},
                    {heading: 'APPOINTMENT_CREATE_NOTES', sortInfo: 'comments', enable: true}];
                createController();
                expect(scope.tableInfo).toEqual(tableInfo);
            });
        });
    });

    it("should print the page with the appointments list", function () {
        appDescriptor.getConfigValue.and.callFake(function (value) {
            if (value === 'printListViewTemplateUrl') {
                return "/bahmni_config/openmrs/apps/appointments/printListView.html";
            }
            return value;
        });
        scope.filterParams = {
            providerUuids: [],
            serviceUuids: [],
            serviceTypeUuids: [],
            statusList: []
        };
        scope.filteredAppointments = [{
            "uuid": "347ae565-be21-4516-b573-103f9ce84a20",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203006",
                "name": "patient name",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 4,
                "name": "Ophthalmology",
                "description": "",
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": 10,
                "location": {},
                "uuid": "02666cc6-5f3e-4920-856d-ab7e28d3dbdb",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": null,
            "location": null,
            "startDateTime": 1503891000000,
            "endDateTime": 1503900900000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }];
        scope.startDate = new Date('2017-01-02T11:30:00.000Z');
        scope.enableSpecialities = true;
        scope.enableServiceTypes = true;
        createController();
        scope.printPage();
        expect(printer.print).toHaveBeenCalledWith("/bahmni_config/openmrs/apps/appointments/printListView.html",
            {
                filteredAppointments: scope.filteredAppointments,
                startDate: scope.startDate,
                enableServiceTypes: scope.enableServiceTypes,
                enableSpecialities: scope.enableSpecialities
            });
    });

    it('should print the page with the default list view when configuration template url is not there', function () {
        appDescriptor.getConfigValue.and.callFake(function (value) {
            if (value === 'printListViewTemplateUrl') {
                return '';
            }
            return value;
        });
        scope.filterParams = {
            providerUuids: [],
            serviceUuids: [],
            serviceTypeUuids: [],
            statusList: []
        };
        scope.filteredAppointments = [{
            "uuid": "347ae565-be21-4516-b573-103f9ce84a20",
            "appointmentNumber": "0000",
            "patient": {
                "identifier": "GAN203006",
                "name": "patient name",
                "uuid": "4175c013-a44c-4be6-bd87-6563675d2da1"
            },
            "service": {
                "appointmentServiceId": 4,
                "name": "Ophthalmology",
                "description": "",
                "speciality": {},
                "startTime": "",
                "endTime": "",
                "maxAppointmentsLimit": null,
                "durationMins": 10,
                "location": {},
                "uuid": "02666cc6-5f3e-4920-856d-ab7e28d3dbdb",
                "color": "#006400",
                "creatorName": null
            },
            "serviceType": null,
            "provider": null,
            "location": null,
            "startDateTime": 1503891000000,
            "endDateTime": 1503900900000,
            "appointmentKind": "Scheduled",
            "status": "Scheduled",
            "comments": null
        }];
        scope.startDate = new Date('2017-01-02T11:30:00.000Z');
        scope.enableSpecialities = true;
        scope.enableServiceTypes = true;
        createController();
        scope.printPage();
        expect(printer.print).toHaveBeenCalledWith("views/manage/list/listView.html",
            {
                filteredAppointments: scope.filteredAppointments,
                startDate: scope.startDate,
                enableServiceTypes: scope.enableServiceTypes,
                enableSpecialities: scope.enableSpecialities
            });
    });

    it('should show a pop up on confirmAction', function () {
        var toStatus = 'Completed';
        var translatedMessage = 'Are you sure you want change status to ' + toStatus + '?';
        $translate.instant.and.returnValue(translatedMessage);
        confirmBox.and.callFake(function (config) {
            expect($translate.instant).toHaveBeenCalledWith('APPOINTMENT_STATUS_CHANGE_CONFIRM_MESSAGE', {toStatus: toStatus});
            expect(config.scope.message).toEqual(translatedMessage);
            expect(config.scope.no).toEqual(jasmine.any(Function));
            expect(config.scope.yes).toEqual(jasmine.any(Function));
            expect(config.actions).toEqual([{name: 'yes', display: 'YES_KEY'}, {name: 'no', display: 'NO_KEY'}]);
            expect(config.className).toEqual('ngdialog-theme-default');
        });
        createController();
        scope.selectedAppointment = {uuid: 'appointmentUuid'};
        scope.confirmAction(toStatus);
        expect(confirmBox).toHaveBeenCalled();
    });

    it('should change status on confirmation on confirmAction', function () {
        var appointment = {uuid: 'appointmentUuid', status: 'Scheduled'};
        var toStatus = 'Cancelled';
        var appointmentResponse = {uuid: 'appointmentUuid', status: toStatus};
        appointmentsService.changeStatus.and.returnValue(specUtil.simplePromise({data: appointmentResponse}));
        createController();
        scope.selectedAppointment = appointment;
        confirmBox.and.callFake(function (config) {
            var close = jasmine.createSpy('close');
            config.scope.yes(close).then(function () {
                expect(appointmentsService.changeStatus).toHaveBeenCalledWith(appointment.uuid, toStatus, undefined);
                expect(scope.selectedAppointment.status).toEqual(appointmentResponse.status);
                expect(close).toHaveBeenCalled();
            });
        });
        scope.confirmAction(toStatus);
    });

    it('should call passed function on cancel on confirmAction', function () {
        var toStatus = 'Completed';
        confirmBox.and.callFake(function (config) {
            var close = jasmine.createSpy('close');
            config.scope.no(close);
            expect(close).toHaveBeenCalled();
        });
        createController();
        scope.selectedAppointment = {uuid: 'appointmentUuid', status: 'CheckedIn'};
        scope.confirmAction(toStatus);
    });

    it('should show a pop up on undo checkIn', function () {
        var translatedMessage = 'Are you sure, you want to undo Check-in this appointment?';
        $translate.instant.and.returnValue(translatedMessage);
        confirmBox.and.callFake(function (config) {
            expect($translate.instant).toHaveBeenCalledWith('APPOINTMENT_UNDO_CHECKIN_CONFIRM_MESSAGE');
            expect(config.scope.message).toEqual(translatedMessage);
            expect(config.scope.no).toEqual(jasmine.any(Function));
            expect(config.scope.yes).toEqual(jasmine.any(Function));
            expect(config.actions).toEqual([{name: 'yes', display: 'YES_KEY'}, {name: 'no', display: 'NO_KEY'}]);
            expect(config.className).toEqual('ngdialog-theme-default');
        });
        createController();
        scope.selectedAppointment = {uuid: 'appointmentUuid'};
        scope.undoCheckIn();
        expect(confirmBox).toHaveBeenCalled();
    });

    it('should change status on confirmation on undo check in', function () {
        var appointment = {uuid: 'appointmentUuid', status: 'CheckedIn'};
        appointmentsService.undoCheckIn.and.returnValue(specUtil.simplePromise({data: {uuid: 'appointmentUuid', status: 'Scheduled'}}));
        createController();
        scope.selectedAppointment = appointment;
        confirmBox.and.callFake(function (config) {
            var close = jasmine.createSpy('close');
            config.scope.yes(close).then(function () {
                expect(appointmentsService.undoCheckIn).toHaveBeenCalledWith(appointment.uuid);
                expect(scope.selectedAppointment.status).toBe('Scheduled');
                expect(close).toHaveBeenCalled();
            });
        });
        scope.undoCheckIn();
    });

    it('should get display of a json object', function () {
        $translate.instant.and.callFake(function (value) {
            return value;
        });
        createController();
        var jsonObject = {"array": [1, 2, 3], "boolean": true, "null": null, "number": 123, "object": {"a": "b", "c": "d", "e": "f"}, "string": "Hello World"};
        var display = scope.display(jsonObject);
        var jsonString = 'array:[1,\t2,\t3],\tboolean:true,\tnull:null,\tnumber:123,\tobject:a:b,\tc:d,\te:f,\tstring:Hello World';
        expect(display).toEqual(jsonString);
    });

    it('should internationalize the keys if present of the json object', function () {
        $translate.instant.and.callFake(function (value) {
            if (value === 'LOCATION_KEY') {
                return 'Location';
            }
            return value;
        });
        createController();
        var jsonObject = {"array": [1, 2, 3], "LOCATION_KEY": "Registration"};
        var display = scope.display(jsonObject);
        var jsonString = 'array:[1,\t2,\t3],\tLocation:Registration';
        expect(display).toEqual(jsonString);
    });

    describe('isAllowedAction', function () {
        it('should init with empty array if config is undefined', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActions') {
                    return undefined;
                }
                return value;
            });
            createController();
            expect(scope.allowedActions).toEqual([]);
        });

        it('should init with configured actions if config is present', function () {
            var allowedActionsConfig = ['Missed', 'CheckedIn'];
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActions') {
                    return allowedActionsConfig;
                }
                return value;
            });
            createController();
            expect(scope.allowedActions).toEqual(allowedActionsConfig);
        });

        it('should return false if config is empty', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActions') {
                    return undefined;
                }
                return value;
            });
            createController();
            expect(scope.isAllowedAction('Missed')).toBeFalsy();
            expect(scope.isAllowedAction('Completed')).toBeFalsy();
            expect(scope.isAllowedAction('Random')).toBeFalsy();
        });

        it('should return true if action exists in config', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActions') {
                    return ['Completed', 'CheckedIn'];
                }
                return value;
            });
            createController();
            expect(scope.isAllowedAction('Completed')).toBeTruthy();
            expect(scope.isAllowedAction('CheckedIn')).toBeTruthy();
        });

        it('should return false if action does not exist in config', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActions') {
                    return ['Completed', 'CheckedIn'];
                }
                return value;
            });
            createController();
            expect(scope.isAllowedAction('Missed')).toBeFalsy();
            expect(scope.isAllowedAction('Random')).toBeFalsy();
        });
    });

    describe('isValidAction', function () {
        it('should init with empty object if config is undefined', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActionsByStatus') {
                    return undefined;
                }
                return value;
            });
            createController();
            expect(scope.allowedActionsByStatus).toEqual({});
        });

        it('should init with configured actions if config is present', function () {
            var allowedActionsByStatus = { "Scheduled": ["Completed", "Missed", "Cancelled"] };
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActionsByStatus') {
                    return allowedActionsByStatus;
                }
                return value;
            });
            createController();
            expect(scope.allowedActionsByStatus).toEqual(allowedActionsByStatus);
        });

        it('should return false if no appointment is selected', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActionsByStatus') {
                    return { CheckedIn: ['Completed'] };
                }
                return value;
            });
            createController();
            scope.selectedAppointment = undefined;
            expect(scope.isValidAction('Missed')).toBeFalsy();
        });

        it('should return false if allowedActionsByStatus is undefined', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActionsByStatus') {
                    return undefined;
                }
                return value;
            });
            createController();
            scope.selectedAppointment = {uuid: 'appointmentUuid', status: 'CheckedIn'};
            expect(scope.allowedActionsByStatus).toEqual({});
            expect(scope.isValidAction('Completed')).toBeFalsy();
        });

        it('should return true if action exists in allowedActionsByStatus', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActionsByStatus') {
                    return { CheckedIn: ['Completed'] };
                }
                return value;
            });
            createController();
            scope.selectedAppointment = {uuid: 'appointmentUuid', status: 'CheckedIn'};
            expect(scope.isValidAction('Completed')).toBeTruthy();
        });

        it('should return false if action does not exist in allowedActionsByStatus', function () {
            appDescriptor.getConfigValue.and.callFake(function (value) {
                if (value === 'allowedActionsByStatus') {
                    return { Scheduled: ['CheckedIn'] };
                }
                return value;
            });
            createController();
            scope.selectedAppointment = {uuid: 'appointmentUuid', status: 'Scheduled'};
            expect(scope.isValidAction('Completed')).toBeFalsy();
        });
    });
});
