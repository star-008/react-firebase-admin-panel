import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Select from "react-select";
import CopyToClipboard from 'react-copy-to-clipboard';
import NotificationAlert from "react-notification-alert";
import Firebase from "firebase";
import config from "../../../config";
import IconUpload from "../../../components/CustomUpload/IconUpload";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Collapse,
    Row,
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Table,
    UncontrolledTooltip
} from "reactstrap";

class ServiceEdit extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            icon_max_limit: 0,
            time_list: [
                { value: 0, label: "00" },
                { value: 1, label: "01" },
                { value: 2, label: "02" },
                { value: 3, label: "03" },
                { value: 4, label: "04" },
                { value: 5, label: "05" },
                { value: 6, label: "06" },
                { value: 7, label: "07" },
                { value: 8, label: "08" },
                { value: 9, label: "09" },
                { value: 10, label: "10" },
                { value: 11, label: "11" },
                { value: 12, label: "12" },
                { value: 13, label: "13" },
                { value: 14, label: "14" },
                { value: 15, label: "15" },
                { value: 16, label: "16" },
                { value: 17, label: "17" },
                { value: 18, label: "18" },
                { value: 19, label: "19" },
                { value: 20, label: "20" },
                { value: 21, label: "21" },
                { value: 22, label: "22" },
                { value: 23, label: "23" }
            ],
            number_list: [],

            service_key: '',
            name: '',
            nameState: 'has-success',
            service_details: '',
            start_character: '',
            number_digits: {value: 4, label:'4'},
            invalid_start_number: false,
            invalid_end_number: false,
            start_number: '0001',
            end_number: '0002',
            priority: 1,
            reset_time: {value: 0, label: '00'},
            is_reset: false,
            build_ai_generated: true,
            auto_close_time: 12,

            new_week_select: {value: 0, label: 'Sunday'},
            new_start_time: '',
            new_end_time: '',
            service_days: [],

            openedCollapses: [],
            last_printed_number: '',
            last_printed_date_time: '',
            last_called_number: '',
            last_called_date_time: '',
            last_called_counter: '',
            last_called_user: '',
            current_status: '',
            last_generated_token: '0000',
            last_generated_token_date_time: '',
            daily_reset_date_time: ''
        };

        this.handleSave = this.handleSave.bind(this);
        this.handleAddDay = this.handleAddDay.bind(this);
    }
    componentWillMount() {
        var id = this.props.match.params.id;
        if (id !== "" && id !== null && id !== undefined) {
            this.setState({service_key: id});
            this.loadData(id);
        }
    }
    loadData() {
        let _this = this;
        _this.setState({loading: true});
        // ---------- Load Icon Max Size ---------- //
        Firebase.firestore().collection('System_Config').doc('Upload_Limits').get().then(function (upload_limit_info) {
            if (upload_limit_info.exists) {
                _this.setState({icon_max_limit: upload_limit_info.data().Max_Icon_size_in_MB});
                // ---------- Load Service Data ---------- //
                Firebase.firestore().collection('Services').doc(_this.state.service_key).get().then(function (doc) {
                    if (doc.exists) {
                        _this.setState({name: doc.data().Name});
                        _this.setState({service_details: doc.data().Details});
                        _this.setState({icon: doc.data().Icon});
                        _this.refs.icon.handleSetUrl(_this.state.icon);
                        _this.setState({start_character: doc.data().Start_Character});
                        _this.setState({number_digits: {value: doc.data().Number_Digits, label: doc.data().Number_Digits}});
                        _this.setState({start_number: doc.data().Start_Number});
                        _this.setState({end_number: doc.data().End_Number});
                        _this.setState({build_ai_generated: doc.data().Build_AI_Generated});
                        _this.setState({auto_close_time: doc.data().Auto_Close_Time});
                        _this.setState({priority: doc.data().Priority});
                        _this.setState({is_reset: doc.data().Auto_Reset});
                        _this.setState({service_days: doc.data().Service_Days});
                        _this.setState({last_printed_number: doc.data().Last_Printed_Number});
                        _this.setState({last_printed_date_time: doc.data().Last_Printed_Date_Time});
                        _this.setState({last_called_number: doc.data().Last_Called_Number});
                        _this.setState({last_called_date_time: doc.data().Last_Called_Date_Time});
                        _this.setState({last_called_counter: doc.data().Last_Called_Counter});
                        _this.setState({last_called_user: doc.data().Last_Called_User});
                        _this.setState({current_status: doc.data().Current_Status});
                        _this.setState({last_generated_token: doc.data().Last_Generated_Token});
                        _this.setState({last_generated_token_date_time: doc.data().Last_Generated_Token_Date_Time});
                        _this.setState({daily_reset_date_time: doc.data().Daily_Reset_Date_Time});
                        let same_one = _this.state.time_list.find(item => item.value === doc.data().Reset_Time);
                        _this.setState({reset_time: same_one});
                        _this.loadStartEndNumberList(doc.data().Sub_Location_ID);
                        _this.setState({loading: false});
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
    }
    loadStartEndNumberList(sub_location_id) {
        let _this = this;
        let number_list = [];
        _this.setState({loading: true});
        _this.setState({number_list: number_list});
        Firebase.firestore().collection('Services').where('Sub_Location_ID', '==', sub_location_id).get().then(function (response) {
            response.docs.forEach(function (doc) {
                if (doc.id !== _this.state.service_key)
                    number_list.push({start_number: doc.data().Start_Number, end_number: doc.data().End_Number});
            });

            _this.setState({number_list: number_list});
            _this.setState({loading: false});
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error");
        });
    }
    handleSave() {
        if (this.state.nameState === "") {
            this.setState({ nameState: "has-danger" });
        }

        if (this.state.nameState === "has-success" && !this.state.invalid_start_number && !this.state.invalid_end_number) {
            let _this = this;
            // Check start and end number overlap //
            if (_this.checkNumberOverlap()) {
                _this.notifyMessage("tc", 3, "Start and end number range overlap!");
                return;
            }

            _this.setState({loading: true});
            var now = new Date();
            let file = this.refs.icon.state.file;
            if (file !== null) {
                // --------- Check Max Icon Size Limit --------- //
                let max_bytes = _this.state.icon_max_limit * 1024 * 1024;
                if (file.size > max_bytes) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Icon file size exceeds maximum size.");
                } else {
                    var storageRef = Firebase.storage().ref();
                    var image_name = "service_icon_" + this.state.service_key;
                    var mainLocationRef = storageRef.child(image_name);
                    mainLocationRef.put(file).then(function (snapshot) {
                        mainLocationRef.getDownloadURL().then(function (res) {
                            let update_service_data = {
                                Icon: res,
                                Name: _this.state.name,
                                Details: _this.state.service_details,
                                Start_Character: _this.state.start_character,
                                Number_Digits: _this.state.number_digits.value,
                                Start_Number: _this.state.start_number,
                                End_Number: _this.state.end_number,
                                Priority: parseInt(_this.state.priority),
                                Reset_Time: parseInt(_this.state.reset_time.value),
                                Auto_Reset: _this.state.is_reset,
                                Build_AI_Generated: _this.state.build_ai_generated,
                                Auto_Close_Time: _this.state.auto_close_time,
                                Service_Days: _this.state.service_days,
                                Updated_Date: now,
                                Last_Printed_Number: _this.state.last_printed_number,
                                Last_Printed_Date_Time: _this.state.last_printed_date_time,
                                Last_Called_Number : _this.state.last_called_number,
                                Last_Called_Date_Time: _this.state.last_called_date_time,
                                Last_Called_Counter: _this.state.last_called_counter,
                                Last_Called_User: _this.state.last_called_user,
                                Current_Status: _this.state.current_status,
                                Last_Generated_Token: _this.state.last_generated_token,
                                Daily_Reset_Date_Time: _this.state.daily_reset_date_time
                            };

                            Firebase.firestore().collection('Services').doc(_this.state.service_key).update(update_service_data)
                                .then(function() {
                                    _this.setState({loading: false});
                                    _this.notifyMessage("tc", 2, "Save Service Success!");
                                    window.setTimeout(function() { _this.props.history.push("/services") }, 2000);
                                }).catch(function (error) {
                                _this.setState({loading: false});
                                _this.notifyMessage("tc", 3, "Network error!");
                            });
                        }).catch(function (err) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Network error!");
                        });
                    }).catch(function (err) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                }
            } else {
                let update_service_data = {
                    Name: _this.state.name,
                    Details: _this.state.service_details,
                    Start_Character: _this.state.start_character,
                    Number_Digits: _this.state.number_digits.value,
                    Start_Number: _this.state.start_number,
                    End_Number: _this.state.end_number,
                    Priority: parseInt(_this.state.priority),
                    Reset_Time: parseInt(_this.state.reset_time.value),
                    Auto_Reset: _this.state.is_reset,
                    Build_AI_Generated: _this.state.build_ai_generated,
                    Auto_Close_Time: _this.state.auto_close_time,
                    Service_Days: _this.state.service_days,
                    Updated_Date: now,
                    Last_Printed_Number: _this.state.last_printed_number,
                    Last_Printed_Date_Time: _this.state.last_printed_date_time,
                    Last_Called_Number : _this.state.last_called_number,
                    Last_Called_Date_Time: _this.state.last_called_date_time,
                    Last_Called_Counter: _this.state.last_called_counter,
                    Last_Called_User: _this.state.last_called_user,
                    Current_Status: _this.state.current_status,
                    Last_Generated_Token: _this.state.last_generated_token,
                    Daily_Reset_Date_Time: _this.state.daily_reset_date_time
                };

                Firebase.firestore().collection('Services').doc(_this.state.service_key).update(update_service_data)
                    .then(function() {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 2, "Save Service Success!");
                        window.setTimeout(function() { _this.props.history.push("/services") }, 2000);
                    }).catch(function (error) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            }
        }
    }
    handleAddDay() {
        let _this = this;
        if (this.state.new_start_time !== "" && this.state.new_end_time !== "") {
            let new_service_day = {
                week_day_order: this.state.new_week_select.value,
                week_day: this.state.new_week_select.label,
                start_time: this.state.new_start_time,
                end_time: this.state.new_end_time
            };

            if (new_service_day.start_time >= new_service_day.end_time) {
                this.notifyMessage("tc", 3, "Start time cannot same or bigger than the end time!");
                return;
            }

            let cur_service_days = this.state.service_days;
            let sames = cur_service_days.filter(item => item.week_day === new_service_day.week_day);
            let overlap = false;
            sames.forEach(function (one) {
                if ((new_service_day.start_time >= one.start_time && new_service_day.start_time <= one.end_time) || (new_service_day.end_time >= one.start_time && new_service_day.end_time <= one.end_time)) {
                    _this.notifyMessage("tc", 3, "Time Range Overlap!");
                    overlap = true;
                    return;
                }
            });

            if (overlap)
                return;

            cur_service_days.push(new_service_day);
            // ------------- Sort Date and Start Time ------------ //
            let sorted = cur_service_days.sort(function(a,b){
                if (a.week_day === b.week_day) {
                    let x = a.start_time < b.start_time? -1:1;
                    return x;
                } else {
                    let x = a.week_day_order < b.week_day_order? -1:1;
                    return x;
                }
            });
            this.setState({service_days: sorted});
            this.setState({new_start_time: ''});
            this.setState({new_end_time: ''});
        }
    }
    handleDeleteDay(index) {
        var cur_service_days = this.state.service_days;
        if (index !== -1) cur_service_days.splice(index, 1);
        this.setState({service_days: cur_service_days});
    }
    increaseStartNumber() {
        if (this.state.start_number.length <= this.state.number_digits.value) {
            let new_num = parseInt(this.state.start_number) + 1;
            let new_token = new_num - 1;
            let str_num = new_num.toString();
            let str_token = new_token.toString();
            let digits = this.state.number_digits.value;
            let pad = '';
            for (let i = 0; i < digits; i++) {
                pad += '0';
            }

            let start_number = pad.substring(0, pad.length - str_num.length) + str_num;
            let last_generated_token = pad.substring(0, pad.length - str_token.length) + str_token;
            this.setState({start_number: start_number});
            this.setState({last_generated_token: last_generated_token});
            if (new_num < parseInt(this.state.end_number)) {
                this.setState({invalid_start_number: false});
                this.setState({invalid_end_number: false});
            } else {
                this.setState({invalid_start_number: true});
            }
        } else {
            this.setState({invalid_start_number: true});
        }
    }
    decreaseStartNumber() {
        if (this.state.start_number.length <= this.state.number_digits.value) {
            let cur_value = parseInt(this.state.start_number);
            if (cur_value > 1) {
                let new_value = parseInt(this.state.start_number) - 1;
                let new_token = new_value - 1;
                let str_num = new_value.toString();
                let str_token = new_token.toString();
                let digits = this.state.number_digits.value;
                let pad = '';
                for (let i = 0; i < digits; i++) {
                    pad += '0';
                }

                let start_number = pad.substring(0, pad.length - str_num.length) + str_num;
                let last_generated_token = pad.substring(0, pad.length - str_token.length) + str_token;
                this.setState({start_number: start_number});
                this.setState({last_generated_token: last_generated_token});
                if (new_value < parseInt(this.state.end_number)) {
                    this.setState({invalid_start_number: false});
                    this.setState({invalid_end_number: false});
                } else {
                    this.setState({invalid_start_number: true});
                }
            }
        } else {
            this.setState({invalid_start_number: true});
        }
    }
    increaseEndNumber() {
        if (this.state.end_number.length <= this.state.number_digits.value) {
            let new_value = parseInt(this.state.end_number) + 1;
            let str = new_value.toString();
            let digits = this.state.number_digits.value;
            let pad = '';
            for (let i = 0; i < digits; i++) {
                pad += '0';
            }

            let new_end_number = pad.substring(0, pad.length - str.length) + str;
            this.setState({end_number: new_end_number});
            if (parseInt(this.state.start_number) < new_value) {
                this.setState({invalid_start_number: false});
                this.setState({invalid_end_number: false});
            } else {
                this.setState({invalid_end_number: true});
            }
        } else {
            this.setState({invalid_end_number: true});
        }
    }
    decreaseEndNumber() {
        if (this.state.end_number.length <= this.state.number_digits.value) {
            let cur_value = parseInt(this.state.end_number);
            if (cur_value > 2) {
                let new_value = parseInt(this.state.end_number) - 1;
                let str = new_value.toString();
                let digits = this.state.number_digits.value;
                let pad = '';
                for(let i=0; i<digits; i++) {
                    pad += '0';
                }

                let new_end_number = pad.substring(0, pad.length - str.length) + str;
                this.setState({end_number: new_end_number});
                if (parseInt(this.state.start_number) < new_value) {
                    this.setState({invalid_start_number: false});
                    this.setState({invalid_end_number: false});
                } else {
                    this.setState({invalid_end_number: true});
                }
            }
        } else {
            this.setState({invalid_end_number: true});
        }
    }
    getServiceDays() {
        return this.state.service_days.map((prop, key) => {
            return (
                <tr key={key}>
                    <td>{prop.week_day}</td>
                    <td>{prop.start_time}</td>
                    <td>{prop.end_time}</td>
                    <td className="td-actions">
                        <Button
                            className="btn-neutral"
                            color="default"
                            data-placement="left"
                            id={"day" + key.toString()}
                            title=""
                            type="button"
                            onClick={e => {e.preventDefault(); this.handleDeleteDay(key);}}
                        >
                            <i className="nc-icon nc-simple-remove" />
                        </Button>
                        <UncontrolledTooltip
                            delay={0}
                            placement="left"
                            target={"day" + key.toString()}
                        >
                            Remove item
                        </UncontrolledTooltip>
                    </td>
                </tr>
            );
        });
    }
    checkNumberOverlap() {
        let number_list = this.state.number_list;
        let start_number = parseInt(this.state.start_number);
        let end_number = parseInt(this.state.end_number);
        let overlap = false;
        number_list.forEach(function (item) {
            if ((start_number >= parseInt(item.start_number) && start_number <= parseInt(item.end_number)) || (end_number >= parseInt(item.start_number) && end_number <= parseInt(item.end_number))) {
                overlap = true;
                return;
            }
        });

        return overlap;
    }
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
    verifyLength = (value, length) => {
        return value.length >= length;
    };
    verifyNumber = value => {
        var numberRex = new RegExp("^[0-9]+$");
        if (numberRex.test(value)) {
            return true;
        }
        return false;
    };
    change = (event, stateName, type, stateNameEqualTo) => {
        switch (type) {
            case "length":
                if (this.verifyLength(event.target.value, stateNameEqualTo)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }

                this.setState({ [stateName]: event.target.value });
                break;
            case "start_number":
                if (this.verifyNumber(event.target.value) && parseInt(event.target.value) > 0
                    && parseInt(event.target.value) < parseInt(this.state.end_number)
                    && event.target.value.length <= this.state.number_digits.value)
                {
                    this.setState({invalid_start_number: false});
                    this.setState({invalid_end_number: false});
                    this.setState({ start_number: event.target.value });
                    let str = (parseInt(event.target.value) - 1).toString();
                    let pad = "0000";
                    let last_generated_token = pad.substring(0, pad.length - str.length) + str;
                    this.setState({ last_generated_token: last_generated_token });
                } else {
                    this.setState({invalid_start_number: true});
                    this.setState({ last_generated_token: "" });
                }
                break;
            case "end_number":
                if (this.verifyNumber(event.target.value) && parseInt(event.target.value) > 1
                    && parseInt(event.target.value) > parseInt(this.state.start_number)
                    && event.target.value.length <= this.state.number_digits.value)
                {
                    this.setState({invalid_end_number: false});
                    this.setState({invalid_start_number: false});
                    this.setState({ end_number: event.target.value });
                } else {
                    this.setState({invalid_end_number: true});
                }
                break;
            case "digits":
                this.setState({number_digits: event});
                let digits = event.value;
                let str_start = parseInt(this.state.start_number).toString();
                let str_end = parseInt(this.state.end_number).toString();
                let pad = '';
                for(let i=0; i<digits; i++) {
                    pad += '0';
                }

                let start_number = pad.substring(0, pad.length - str_start.length) + str_start;
                let end_number = pad.substring(0, pad.length - str_end.length) + str_end;
                this.setState({start_number: start_number});
                this.setState({end_number: end_number});
                if (str_start.length > pad.length) {
                    this.setState({invalid_start_number: true});
                } else {
                    this.setState({invalid_start_number: false});
                }

                if (str_end.length > pad.length) {
                    this.setState({invalid_end_number: true});
                } else {
                    this.setState({invalid_end_number: false});
                }
                break;
            default:
                break;
        }
        // this.setState({ [stateName]: event.target.value });
    };
    collapsesToggle = collapse => {
        let openedCollapses = this.state.openedCollapses;
        if (openedCollapses.includes(collapse)) {
            this.setState({
                openedCollapses: openedCollapses.filter(item => item !== collapse)
            });
        } else {
            openedCollapses.push(collapse);
            this.setState({
                openedCollapses: openedCollapses
            });
        }
    };
    render() {
        let {
            nameState
        } = this.state;
        return (
            <>
                <LoadingOverlay
                    active={this.state.loading}
                    spinner
                    text='Loading'
                    className='content'
                >
                    <NotificationAlert ref="notificationAlert" />
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Service Edit</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Col className="ml-auto mr-auto" lg="8">
                                        <Row>
                                            <Col md="3">
                                                <Button
                                                    color="success"
                                                    onClick={e => this.handleSave()}
                                                    block
                                                >
                                                    Save
                                                </Button>
                                            </Col>
                                            <Col md="3">
                                                <Button
                                                    color="youtube"
                                                    onClick={e => this.props.history.push("/services")}
                                                    block
                                                >
                                                    Close
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row className="top-margin-10">
                                        </Row>
                                        <Row>
                                            <Col md="8">
                                                <Form className="form-horizontal">
                                                    <Row>
                                                        <Label md="4">Service Key</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Row>
                                                                    <Col md="9">
                                                                        <Input
                                                                            value={this.state.service_key}
                                                                            disabled
                                                                        />
                                                                    </Col>
                                                                    <Col md="3">
                                                                        <CopyToClipboard
                                                                            text={this.state.service_key}
                                                                            onCopy={e => this.notifyMessage("tc", 2, "Copied to clipboard")}
                                                                        >
                                                                            <Button className="margin-0 btn btn-primary text-capitalize" block>Copy</Button>
                                                                        </CopyToClipboard>
                                                                    </Col>
                                                                </Row>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Service Name</Label>
                                                        <Col md="8">
                                                            <FormGroup className={`has-label ${nameState}`}>
                                                                <Input
                                                                    defaultValue={this.state.name}
                                                                    type="text"
                                                                    onChange={e =>
                                                                        this.change(e, "name", "length", 1)
                                                                    }
                                                                />
                                                                {this.state.nameState === "has-danger" ? (
                                                                    <label className="error">This field is required.</label>
                                                                ) : null}
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Icon</Label>
                                                        <Col md="8">
                                                            <IconUpload ref="icon" />
                                                        </Col>
                                                    </Row>
                                                    <Row className="top-margin-10">
                                                        <Label md="4">Service Details</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    value={this.state.service_details}
                                                                    type="textarea"
                                                                    onChange={e => {this.setState({service_details: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Start Character</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    placeholder="Start Character"
                                                                    type="text"
                                                                    maxLength="3"
                                                                    onChange={e => {this.setState({start_character: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Number of digits</Label>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Select
                                                                    className="react-select primary"
                                                                    classNamePrefix="react-select"
                                                                    value={this.state.number_digits}
                                                                    onChange={value =>
                                                                        this.change(value, "digits", "digits")
                                                                    }
                                                                    options={[
                                                                        { value: 3, label: '3'},
                                                                        { value: 4, label: '4'},
                                                                        { value: 5, label: '5'},
                                                                        { value: 6, label: '6'}
                                                                    ]}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Start Number</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Row>
                                                                    <Col md="4" xs="4">
                                                                        <Input
                                                                            value={this.state.start_number}
                                                                            type="text"
                                                                            maxLength={this.state.number_digits.value}
                                                                            invalid={this.state.invalid_start_number}
                                                                            onChange={e => {this.change(e, "start_number", "start_number")}}
                                                                        />
                                                                    </Col>
                                                                    <Col md="8" xs="8" className="padding-left-0">
                                                                        <Button
                                                                            className="margin-top-0"
                                                                            color="primary"
                                                                            onClick={e => this.increaseStartNumber()}
                                                                        >
                                                                            <i className="fa fa-plus" />
                                                                        </Button>
                                                                        <Button
                                                                            className="margin-top-0"
                                                                            color="primary"
                                                                            onClick={e => this.decreaseStartNumber()}
                                                                        >
                                                                            <i className="fa fa-minus" />
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">End Number</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Row>
                                                                    <Col md="4" xs="4">
                                                                        <Input
                                                                            value={this.state.end_number}
                                                                            type="text"
                                                                            maxLength={this.state.number_digits.value}
                                                                            invalid={this.state.invalid_end_number}
                                                                            onChange={e => {this.change(e, "end_number", "end_number")}}
                                                                        />
                                                                    </Col>
                                                                    <Col md="8" xs="8" className="padding-left-0">
                                                                        <Button
                                                                            className="margin-top-0"
                                                                            color="primary"
                                                                            onClick={e => this.increaseEndNumber()}
                                                                        >
                                                                            <i className="fa fa-plus" />
                                                                        </Button>
                                                                        <Button
                                                                            className="margin-top-0"
                                                                            color="primary"
                                                                            onClick={e => this.decreaseEndNumber()}
                                                                        >
                                                                            <i className="fa fa-minus" />
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Priority</Label>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    value={this.state.priority}
                                                                    type="number"
                                                                    min={1}
                                                                    onChange={e => {this.setState({priority: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4"/>
                                                        <Col md="4">
                                                            <FormGroup>
                                                                <div className="form-check-radio">
                                                                    <Label check>
                                                                        <Input
                                                                            checked={!this.state.is_reset}
                                                                            defaultValue="option1"
                                                                            id="exampleRadios11"
                                                                            name="exampleRadioz"
                                                                            type="radio"
                                                                            onChange={e => {this.setState({is_reset: !this.state.is_reset})}}
                                                                        />
                                                                        Daily at Reset time <span className="form-check-sign" />
                                                                    </Label>
                                                                </div>
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="3">
                                                            <Select
                                                                className="react-select primary"
                                                                classNamePrefix="react-select"
                                                                isDisabled={this.state.is_reset}
                                                                value={this.state.reset_time}
                                                                onChange={value =>
                                                                    this.setState({ reset_time: value })
                                                                }
                                                                options={this.state.time_list}
                                                            />
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4"/>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <div className="form-check-radio">
                                                                    <Label check>
                                                                        <Input
                                                                            checked={this.state.is_reset}
                                                                            defaultValue="option2"
                                                                            id="exampleRadios12"
                                                                            name="exampleRadioz"
                                                                            type="radio"
                                                                            onChange={e => {this.setState({is_reset: !this.state.is_reset})}}
                                                                        />
                                                                        Reset When Maximum number is reached <span className="form-check-sign" />
                                                                    </Label>
                                                                </div>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Generated Token ahead</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <div className="form-check-radio top-margin-7">
                                                                    <Label check>
                                                                        <Input
                                                                            checked={this.state.build_ai_generated}
                                                                            name="token_radio"
                                                                            type="radio"
                                                                            onChange={e => {this.setState({build_ai_generated: !this.state.build_ai_generated})}}
                                                                        />
                                                                        Build in AI Generated <span className="form-check-sign" />
                                                                    </Label>
                                                                </div>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4"/>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <div className="form-check-radio">
                                                                    <Label check>
                                                                        <Input
                                                                            checked={!this.state.build_ai_generated}
                                                                            name="token_radio"
                                                                            type="radio"
                                                                            onChange={e => {this.setState({build_ai_generated: !this.state.build_ai_generated})}}
                                                                        />
                                                                        Specific to service <span className="form-check-sign" />
                                                                    </Label>
                                                                </div>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <label md="8" xs="8" className="top-margin-10">auto close Open Tokens more than</label>
                                                        <Col md="2" xs="3">
                                                            <FormGroup>
                                                                <Input
                                                                    value={this.state.auto_close_time}
                                                                    type="number"
                                                                    min={0}
                                                                    max={24}
                                                                    onChange={e => { if(e.target.value.length<3){this.setState({auto_close_time: e.target.value})}}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <label className="top-margin-10">hours</label>
                                                    </Row>
                                                    <Row>
                                                        <Col md="4">
                                                            <FormGroup>
                                                                <Select
                                                                    className="react-select primary"
                                                                    classNamePrefix="react-select"
                                                                    name="weekSelect"
                                                                    value={this.state.new_week_select}
                                                                    onChange={value =>
                                                                        this.setState({ new_week_select: value })
                                                                    }
                                                                    options={[
                                                                        { value: 0, label: "Sunday" },
                                                                        { value: 1, label: "Monday" },
                                                                        { value: 2, label: "Tuesday" },
                                                                        { value: 3, label: "Wednesday" },
                                                                        { value: 4, label: "Thursday" },
                                                                        { value: 5, label: "Friday" },
                                                                        { value: 6, label: "Saturday" },
                                                                    ]}
                                                                    placeholder="Select day of the week"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    placeholder="Start Time"
                                                                    value={this.state.new_start_time}
                                                                    type="time"
                                                                    onChange={e => {this.setState({new_start_time: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    placeholder="End Time"
                                                                    value={this.state.new_end_time}
                                                                    type="time"
                                                                    onChange={e => {this.setState({new_end_time: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="2">
                                                            <Button
                                                                className="top-margin-2"
                                                                color="success"
                                                                onClick={e => this.handleAddDay()}
                                                                block
                                                            >
                                                                Add
                                                            </Button>
                                                        </Col>
                                                        <Col md="12">
                                                            <FormGroup>
                                                                <Table bordered>
                                                                    <thead className="text-center back">
                                                                    <tr>
                                                                        <th>Day</th>
                                                                        <th>Start Time</th>
                                                                        <th>End Time</th>
                                                                        <th/>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody className="text-center">
                                                                    {this.getServiceDays()}
                                                                    </tbody>
                                                                </Table>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Card className="card-plain width-100">
                                                            <CardHeader role="tab">
                                                                <a
                                                                    aria-expanded={this.state.openedCollapses.includes(
                                                                        "show-more"
                                                                    )}
                                                                    href="#"
                                                                    data-parent="#accordion"
                                                                    data-toggle="collapse"
                                                                    onClick={e => {e.preventDefault(); this.collapsesToggle("show-more");}}
                                                                >
                                                                    Show More...{" "}
                                                                </a>
                                                            </CardHeader>
                                                            <Collapse
                                                                role="tabpanel"
                                                                isOpen={this.state.openedCollapses.includes(
                                                                    "show-more"
                                                                )}
                                                            >
                                                                <CardBody>
                                                                    <Row>
                                                                        <Label md="4">Last Printed Number</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_printed_number}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Printed Datetime</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_printed_date_time}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Sub Location Count</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.sub_location_cnt}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Called Number</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_called_number}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Called Datetime</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_called_date_time}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Called Counter</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_called_counter}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Called User</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_called_user}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Current Status</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.current_status}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Generated Token</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_generated_token}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Generated Token Datetime</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.last_generated_token_date_time.toLocaleString()}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Daily Reset Datetime</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={this.state.daily_reset_date_time}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                </CardBody>
                                                            </Collapse>
                                                        </Card>
                                                    </Row>
                                                </Form>
                                            </Col>
                                        </Row>
                                    </Col>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </LoadingOverlay>
            </>
        );
    }
}

export default ServiceEdit;
