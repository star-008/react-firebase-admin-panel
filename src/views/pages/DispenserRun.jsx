import React from "react";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import ReactToPrint from 'react-to-print';
import Firebase from "firebase";
import PasswordHash from "password-hash";
import config from "../../config";

import {
    Button,
    Input,
    FormGroup,
    Label,
    Modal,
    Col,
    Row
} from "reactstrap";

const uuidv1 = require('uuid/v1');

class DispenserRun extends React.Component {
    constructor(props) {
        super(props);

        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            customer_id: '',
            own_email: '',
            own_password: '',
            own_pin: '',
            dispenser_id: '',
            max_height: 0,
            max_width: 0,
            sub_location_id: '',
            modalClassic: false,

            hideCloseBtn: true,
            show_location_icon: true,
            button_layout_format: 'full',
            enable_print_logo: true,
            print_logo_image_url: '',
            print_type: '',
            dispenser_name: '',
            height: 0,
            width: 0,
            pin: '',
            location_image_url: '',
            location_name: '',
            location_address: '',
            service_list: [],
            close_format: 'pin',
            current_time: '',
            print_time: '',
            footer_text: '',
            print_service_name: '',
            print_service_details: '',
            print_last_generated_token: '',
            print_service_pending_count: '',
            token_list: []
        };
    }
    componentWillMount() {
        let id = localStorage.getItem('running_dispenser');
        if (id !== "" && id !== null && id !== undefined) {
            this.setState({dispenser_id: id});
            this.loadData(id);
        } else {
            this.props.history.push('/welcome');
        }
    }
    componentDidMount() {
        this.getCurrentTime();
    }
    loadData(id) {
        let _this = this;
        _this.setState({loading: true});
        let customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
        let email = JSON.parse(localStorage.getItem('auth_info')).email;
        _this.setState({own_email: email});
        _this.setState({customer_id: customer_id});
        // ---------- Load Token List ---------- //
        Firebase.firestore().collection('Token_Details').get().then(function (tokens) {
            let token_list = [];
            tokens.docs.forEach(function (doc) {
                token_list.push(doc.data());
            });

            _this.setState({token_list: token_list});
            Firebase.firestore().collection('Web_App_Users').doc(email).get().then(function (doc) {
                if (doc.exists) {
                    _this.setState({own_password: doc.data().Password});
                    // ---------- Load Max Height and Width ---------- //
                    Firebase.firestore().collection('System_Config').doc('Dispensor_Settings').get().then(function (dispenser_setting) {
                        if (dispenser_setting.exists) {
                            _this.setState({max_height: dispenser_setting.data().Dispensor_Max_Height});
                            _this.setState({max_width: dispenser_setting.data().Dispensor_Max_Width});
                            // ---------- Load Dispenser Data ---------- //
                            Firebase.firestore().collection('Dispensers').doc(id).get().then(function (doc) {
                                if (doc.exists) {
                                    _this.setState({sub_location_id: doc.data().Sub_Location_ID});
                                    _this.setState({show_location_icon: doc.data().Show_Location_Icon});
                                    _this.setState({footer_text: doc.data().Footer_Text});
                                    _this.setState({button_layout_format: doc.data().Button_Layout_Format});
                                    _this.setState({enable_print_logo: doc.data().Enable_Print_Logo});
                                    _this.setState({print_logo_image_url: doc.data().Print_Logo_Image_Url});
                                    _this.setState({print_type: doc.data().Print_Type});
                                    _this.setState({dispenser_name: doc.data().Name});
                                    _this.setState({height: doc.data().Layout_Height});
                                    _this.setState({width: doc.data().Layout_Width});
                                    _this.setState({own_pin: doc.data().Pin});
                                    // ---------- Load Sub Location Data ---------- //
                                    Firebase.firestore().collection('Sub_Locations').doc(doc.data().Sub_Location_ID).get().then(function (sub_location) {
                                        if (sub_location.exists) {
                                            _this.setState({ location_image_url : sub_location.data().Icon });
                                            _this.setState({ location_name : sub_location.data().Name });
                                            _this.setState({ location_address : sub_location.data().Address });
                                            _this.loadServiceListBySub(doc.data().Sub_Location_ID);
                                        } else {
                                            _this.setState({loading: false});
                                            _this.notifyMessage("tc", 3, "Network error!");
                                        }
                                    }).catch(function (err) {
                                        _this.setState({loading: false});
                                        _this.notifyMessage("tc", 3, "Network error!");
                                    });
                                } else {
                                    _this.setState({loading: false});
                                    _this.notifyMessage("tc", 3, "Network error!");
                                }
                            }).catch(function (err) {
                                _this.setState({loading: false});
                                _this.notifyMessage("tc", 3, "Network error!");
                            });
                        } else {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Network error!");
                        }
                    }).catch(function (err) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                } else {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                }
            }).catch(function (err) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            });
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    loadServiceListBySub(sub_id) {
        let _this = this;
        _this.setState({loading: true});
        let services = [];
        Firebase.firestore().collection('Services').where('Sub_Location_ID', '==', sub_id).get().then(function (response) {
            response.docs.forEach(function (doc) {
                services.push({service_id: doc.id, service_name: doc.data().Name, service_details: doc.data().Details,
                    is_reset: doc.data().Auto_Reset, reset_time: doc.data().Reset_Time, last_generated_token_date_time: doc.data().Last_Generated_Token_Date_Time,
                    last_generated_token: doc.data().Last_Generated_Token, start_number: doc.data().Start_Number, end_number: doc.data().End_Number,
                    main_location_id: doc.data().Main_Location_ID, sub_location_id: doc.data().Sub_Location_ID, priority: doc.data().Priority});
            });

            _this.setState({service_list: services});
            _this.setState({loading: false});
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    handlePrint(idx) {
        let _this = this;
        _this.setState({loading: true});
        let now = new Date();
        let service_list = _this.state.service_list;
        let print_service = _this.state.service_list[idx];
        _this.setState({print_time: now.toLocaleString()});
        _this.setState({print_service_name: print_service.service_name});
        _this.setState({print_service_details: print_service.service_details});
        let is_reset = print_service.is_reset;
        let reset_time = print_service.reset_time;
        let last_generated_token = print_service.last_generated_token;
        let last_generated_token_date_time = print_service.last_generated_token_date_time;
        let start_number = print_service.start_number;
        let end_number = print_service.end_number;
        let digits = last_generated_token.length;
        if (is_reset) {
            let limit_reset = new Date();
            limit_reset.setHours(reset_time);
            if (last_generated_token_date_time > limit_reset) {
                last_generated_token = start_number;
            } else {
                let new_token = parseInt(last_generated_token) + 1;
                if (new_token === parseInt(end_number)) {
                    last_generated_token = start_number;
                } else {
                    let str_token = new_token.toString();
                    let pad = '';
                    for (let i = 0; i < digits; i++) {
                        pad += '0';
                    }

                    last_generated_token = pad.substring(0, pad.length - str_token.length) + str_token;
                }
            }
        } else {
            let new_token = parseInt(last_generated_token) + 1;
            if (new_token === parseInt(end_number)) {
                last_generated_token = start_number;
            } else {
                let str_token = new_token.toString();
                let pad = '';
                for (let i = 0; i < digits; i++) {
                    pad += '0';
                }

                last_generated_token = pad.substring(0, pad.length - str_token.length) + str_token;
            }
        }

        last_generated_token_date_time = now;
        print_service.last_generated_token = last_generated_token;
        print_service.last_generated_token_date_time = last_generated_token_date_time;
        service_list[idx] = print_service;
        _this.setState({service_list: service_list});

        let dispenser_id = uuidv1();
        let new_token_data = {
            Created_Date: now,
            Input_Source: "Cloud_Dispenser",
            Updated_Date: now,
            Main_Location_ID: print_service.main_location_id,
            Sub_Location_ID: print_service.sub_location_id,
            Priority: print_service.priority,
            Service_End_Date: new Date('9999-12-30 00:00:00'),
            Service_Status: "Pending",
            Service_ID:  print_service.service_id,
            Service_Name: print_service.service_name,
            Service_Name_Details: print_service.service_details,
            Status: "Open",
            Service_Start_Date: now,
            Token_Number: last_generated_token,
            Customer_Mobile: '',
            Customer_ID: _this.state.customer_id,
            Rating: "Not_Rated",
            Rated_Datetime: new Date('9999-12-30 00:00:00'),
            Rated_Comments: ""
        };

        let token_list = _this.state.token_list;
        Firebase.firestore().collection('Token_Details').doc(dispenser_id).set(new_token_data).then(function (response) {
            token_list.push(new_token_data);
            _this.setState({token_list: token_list});
            let service_pending_count = token_list.filter(item => item.Service_ID === print_service.service_id && item.Service_Status === "Pending" && item.Status === "Open").length;
            _this.setState({print_last_generated_token: last_generated_token});
            _this.setState({print_service_pending_count: service_pending_count});
            if (_this.state.print_type === "normal") {
                _this.setState({enablePrint: true});
                _this.setState({hideCloseBtn: true});
                window.setTimeout(function() { _this.setState({loading: false}); _this.refs.printElement.triggerRef.click(); }, 500);
            } else if (_this.state.print_type === "v001") {
                let items = [
                    {
                        text: _this.state.location_name,
                        fontsize: "4",
                        align: "2",
                        bold: true,
                        linebreak: false
                    },
                    {
                        text: _this.state.location_address,
                        fontsize: "1",
                        align: "2",
                        bold: false,
                        linebreak: false
                    },
                    {
                        text: _this.state.print_service_name,
                        fontsize: "3",
                        align: "2",
                        bold: true,
                        linebreak: false
                    },
                    {
                        text: _this.state.print_last_generated_token,
                        fontsize: "4",
                        align: "2",
                        bold: false,
                        linebreak: true
                    },
                    {
                        text: _this.state.print_service_pending_count.toString(),
                        fontsize: "1",
                        align: "1",
                        bold: false,
                        linebreak: false
                    },
                    {
                        text: _this.state.print_time,
                        fontsize: "1",
                        align: "1",
                        bold: false,
                        linebreak: false
                    }
                ];
                let arg2 = JSON.stringify(items);
                let links = '';
                if (_this.state.enable_print_logo) {
                    links = 'citaq://my.com/?arg0=1001' +
                            '&arg1=/mnt/internal_sd/Download/logo.jpg' +
                            '&arg2=' +  arg2;
                } else {
                    links = 'citaq://my.com/?arg0=1001' +
                            '&arg1=' +
                            '&arg2=' +  arg2;
                }

                window.location.href = links;
                _this.setState({loading: false});
            }

            Firebase.firestore().collection('Services').doc(print_service.service_id).update({Pending_Count: service_pending_count, Last_Generated_Token_Date_Time: last_generated_token_date_time, Last_Generated_Token: last_generated_token}).then(function () {
            }).catch(function (err) {
                _this.notifyMessage("tc", 3, "Network error!");
            });

            let mainlocation_pending_count = token_list.filter(item => item.Main_Location_ID === print_service.main_location_id && item.Service_Status === "Pending" && item.Status === "Open").length;
            Firebase.firestore().collection('Main_Locations').doc(print_service.main_location_id).update({Pending_Count: mainlocation_pending_count}).then(function () {

            }).catch(function (err) {
                _this.notifyMessage("tc", 3, "Network error!");
            });

            let sublocation_pending_count = token_list.filter(item => item.Sub_Location_ID === print_service.sub_location_id && item.Service_Status === "Pending" && item.Status === "Open").length;
            Firebase.firestore().collection('Sub_Locations').doc(print_service.sub_location_id).update({Pending_Count: sublocation_pending_count}).then(function () {
            }).catch(function (err) {
                _this.notifyMessage("tc", 3, "Network error!");
            });
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    getCurrentTime() {
        let _this = this;
        let now = new Date();
        _this.setState({current_time: now.toLocaleString()});
        window.setTimeout(function() { _this.getCurrentTime() }, 500);
    }
    onAfterPrint() {
        this.setState({enablePrint: false});
    }
    getServices() {
        let _this = this;
        let format = this.state.button_layout_format;
        return this.state.service_list.map(function (prop, key) {
            return (
                <div key={key} className={format==="full"?"col-lg-12 col-sm-12 col-xs-12":"col-lg-6 col-sm-6 col-xs-6" + " text-center"}>
                    <button className="btn btn-secondary text-capitalize btn-block" onClick={e => {e.preventDefault(); _this.handlePrint(key)}}>
                        <span className="overflow-ellipsis font-weight-bold fs-15">{prop.service_name}</span>
                        <br/>
                        <span className="overflow-ellipsis">{prop.service_details}</span>
                    </button>
                </div>
            );
        });
    }
    onClickClose() {
        this.setState({modalClassic: true});
    }
    handleClose() {
        if (this.state.close_format === "pin") {
            if (parseInt(this.state.pin) === this.state.own_pin) {
                localStorage.removeItem('running_dispenser');
                this.props.history.goBack();
            } else {
                this.notifyMessage("tc", 3, "Pin is incorrect");
            }
        } else {
            if (this.state.email.toLocaleLowerCase() === this.state.own_email) {
                if (PasswordHash.verify(this.state.password, this.state.own_password)) {
                    localStorage.removeItem('running_dispenser');
                    this.props.history.goBack();
                } else {
                    this.notifyMessage("tc", 3, "Password is incorrect");
                }
            } else {
                this.notifyMessage("tc", 3, "Email is incorrect");
            }
        }
    }
    toggleModalClassic = () => {
        this.setState({
            modalClassic: !this.state.modalClassic
        });
    };
    notifyMessage = (place, color, text) => {
        var type;
        switch (color) {
            case 1:
                type = "primary";
                break;
            case 2:
                type = "success";
                break;
            case 3:
                type = "danger";
                break;
            case 4:
                type = "warning";
                break;
            case 5:
                type = "info";
                break;
            default:
                break;
        }

        var options = {};
        options = {
            place: place,
            message: (
                <div className="text-md-center">
                    <div>
                        <b>{text}</b>
                    </div>
                </div>
            ),
            type: type,
            icon: "now-ui-icons ui-1_bell-53",
            autoDismiss: 3
        };
        this.refs.notificationAlert.notificationAlert(options);
    };
    render() {
        return (
            <>
                <LoadingOverlay
                    active={this.state.loading}
                    spinner
                    text='Loading'
                    className='content'
                >
                    <NotificationAlert ref="notificationAlert" />
                    <Modal
                        isOpen={this.state.modalClassic}
                        toggle={this.toggleModalClassic}
                    >
                        <div className="modal-header justify-content-center">
                            <button
                                aria-label="Close"
                                className="close"
                                data-dismiss="modal"
                                type="button"
                                onClick={this.toggleModalClassic}
                            >
                                <i className="nc-icon nc-simple-remove" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <Col lg="12" xs="12" className="text-left">
                                    <div className="form-check-radio">
                                        <Label check className="left-margin-10">
                                            <Input
                                                defaultChecked={this.state.close_format==='pin'}
                                                name="buttonLayoutRadio"
                                                type="radio"
                                                onChange={e => {this.setState({close_format: 'pin'})}}
                                            />
                                            Pin <span className="form-check-sign" />
                                        </Label>
                                    </div>
                                </Col>
                            </div>
                            <div className="row">
                                <Col lg="12" xs="12" className="text-left">
                                    <div className="form-check-radio">
                                        <Label check className="left-margin-10">
                                            <Input
                                                defaultChecked={this.state.close_format==='pass'}
                                                name="buttonLayoutRadio"
                                                type="radio"
                                                onChange={e => {this.setState({close_format: 'pass'})}}
                                            />
                                            Standard Email/Password <span className="form-check-sign" />
                                        </Label>
                                    </div>
                                </Col>
                            </div>
                            <div className="row top-margin-12">
                            </div>
                            <div className="row" hidden={this.state.close_format === 'pass'}>
                                <Label lg="3" xs="3">Pin</Label>
                                <Col lg="9" xs="9">
                                    <FormGroup>
                                        <Row>
                                            <Col lg="12" xs="12">
                                                <Input
                                                    value={this.state.pin}
                                                    type="password"
                                                    onChange={e => this.setState({pin: e.target.value})}
                                                />
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                </Col>
                            </div>
                            <div className="row" hidden={this.state.close_format === 'pin'}>
                                <Label lg="3" xs="3">Email</Label>
                                <Col lg="9" xs="9">
                                    <FormGroup>
                                        <Row>
                                            <Col lg="12" xs="12">
                                                <Input
                                                    value={this.state.email}
                                                    type="email"
                                                    onChange={e => this.setState({email: e.target.value})}
                                                />
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                </Col>
                            </div>
                            <div className="row" hidden={this.state.close_format === 'pin'}>
                                <Label lg="3" xs="3">Password</Label>
                                <Col lg="9" xs="9">
                                    <FormGroup>
                                        <Row>
                                            <Col lg="12" xs="12">
                                                <Input
                                                    value={this.state.password}
                                                    type="password"
                                                    onChange={e => this.setState({password: e.target.value})}
                                                />
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                </Col>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="left-side">
                                <Button
                                    className="btn-link"
                                    color="youtube"
                                    type="button"
                                    onClick={e => this.handleClose()}
                                >
                                    Close
                                </Button>
                            </div>
                            <div className="divider" />
                            <div className="right-side">
                                <Button
                                    className="btn-link"
                                    color="danger"
                                    type="button"
                                    onClick={this.toggleModalClassic}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Modal>
                    <Row>
                        <Col className="ml-auto mr-auto" xl="4" lg="6" md="8" sm="8" xs="12">
                            <div className="border card top-margin-10 dispenser-card">
                                <div hidden={this.state.enablePrint} style={{paddingBottom: '174%'}}>
                                    <div className="fixed-div">
                                        <div className="row">
                                            <div className="col-4 col-xl-3 col-lg-3 col-sm-3 col-xs-4 border custom-close-section" onClick={e => this.setState({hideCloseBtn: false})}>
                                                <button hidden={this.state.hideCloseBtn} className="btn btn-lg btn-danger text-center btn-block"
                                                        onClick={e => this.onClickClose(e)}>
                                                    Close
                                                </button>
                                            </div>
                                            <div className="col-lg-12 col-xs-12 text-center">
                                                <img src={this.state.location_image_url} alt="..." className="width-20" />
                                            </div>
                                            <div className="col-lg-12 col-xs-12 text-center top-margin-12">
                                                <h5>{this.state.location_name}</h5>
                                                <label>{this.state.location_address}</label>
                                            </div>
                                            <div className="col-lg-12 col-xs-12">
                                                <hr/>
                                            </div>
                                            {this.getServices()}
                                        </div>
                                    </div>
                                    <div className="col-lg-12 col-xs-12 custom-footer-2">
                                        <button className="btn btn-block btn-lg text-center" disabled>
                                            <span className="text-capitalize">{this.state.current_time}</span>
                                        </button>
                                    </div>
                                    <div className="col-lg-12 col-xs-12 custom-footer-1">
                                        <button className="btn btn-block btn-lg text-center" disabled>
                                            <span className="text-capitalize">{this.state.footer_text===""?'\u00A0':this.state.footer_text}</span>
                                        </button>
                                    </div>
                                </div>
                                <ReactToPrint
                                    ref="printElement"
                                    trigger={() => <button hidden ref="printButton">Print this out!</button>}
                                    content={() => this.refs.printContent}
                                    onAfterPrint={() => this.onAfterPrint()}
                                />
                                <div ref="printContent" hidden={!this.state.enablePrint} style={{height: "90vh", padding: '5vh'}}>
                                    <div className="padding-10">
                                        <div className="row">
                                            <div
                                                className="col-lg-12 col-xs-12 text-center print-image-div"
                                                hidden={!this.state.enable_print_logo}
                                                style={{backgroundImage: 'url('+this.state.print_logo_image_url+')'}}
                                            />
                                            <div className="col-lg-12 col-xs-12 text-center top-margin-12">
                                                <h1>{this.state.location_name}</h1>
                                                <h5>{this.state.location_address}</h5>
                                            </div>
                                            <div className="col-lg-12 col-xs-12 text-center">
                                                <h2>{this.state.print_service_name}</h2>
                                            </div>
                                            <div className="col-lg-12 col-xs-12 text-center">
                                                <h5>{this.state.print_service_details}</h5>
                                            </div>
                                            <div className="col-lg-12 col-xs-12 text-center">
                                                <h3>{this.state.print_last_generated_token}</h3>
                                            </div>
                                            <div className="col-lg-12 col-xs-12 text-center">
                                                <h5>{this.state.print_service_pending_count} Tokens ahead of you</h5>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-lg-12 col-xs-12 text-center custom-footer-4">
                                                <h5>{this.state.print_time}</h5>
                                            </div>
                                            <div className="col-lg-12 col-xs-12 text-center custom-footer-3 bottom-margin-20">
                                                <h5>{this.state.footer_text===""?'\u00A0':this.state.footer_text}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </LoadingOverlay>
            </>
        );
    }
}

export default DispenserRun;
