import React from "react";
import NotificationAlert from "react-notification-alert";
import Firebase from "firebase";
import LoadingOverlay from "react-loading-overlay";
import Select from "react-select";
import ReactBSAlert from "react-bootstrap-sweetalert";
import printerImage from "../../../assets/img/printer2.png";
import config from "../../../config";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Button,
    Label,
    Form,
    FormGroup,
    Input
} from "reactstrap";

class Dispensers extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            customer_id: '',
            role: '',

            dispenser_list: [],
            main_location_list: [],
            sub_location_list: [],
            selected_main_location: null,
            selected_sub_location: null,
            alert: null
        };
    }
    componentWillMount() {
        this.loadMaxSize();
    }
    loadMaxSize() {
        let _this = this;
        _this.setState({loading: true});
        // ---------- Load Max Height and Width ---------- //
        Firebase.firestore().collection('System_Config').doc('Dispensor_Settings').get().then(function (dispenser_setting) {
            if (dispenser_setting.exists) {
                _this.setState({max_height: dispenser_setting.data().Dispensor_Max_Height});
                _this.setState({max_width: dispenser_setting.data().Dispensor_Max_Width});
                _this.loadMainLocations();
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    loadMainLocations() {
        let _this = this;
        let main_locations = [];
        let customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
        let email = JSON.parse(localStorage.getItem('auth_info')).email;
        _this.setState({customer_id: customer_id});
        let role = JSON.parse(localStorage.getItem('auth_info')).role;
        _this.setState({role: role});

        // ---------- Load Location List ---------- //
        Firebase.firestore().collection('Main_Locations').where('Customer_ID', '==', customer_id).get().then(function (response) {
            response.docs.forEach(function (doc) {
                main_locations.push({label: doc.data().Name, value: doc.id});
            });

            _this.setState({main_location_list: main_locations});
            if (main_locations.length > 0) {
                _this.setState({selected_main_location: main_locations[0]});
                _this.loadSubLocationByMain(main_locations[0].value);
            } else {
                _this.setState({loading: false});
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    loadSubLocationByMain(main_id) {
        let _this = this;
        _this.setState({loading: true});
        _this.setState({selected_sub_location: null});
        let sub_locations = [];
        Firebase.firestore().collection('Sub_Locations').where('Main_Location_ID', '==', main_id).get().then(function (response) {
            response.docs.forEach(function (doc) {
                sub_locations.push({label: doc.data().Name, value: doc.id, image_url: doc.data().Icon, address: doc.data().Address});
            });

            _this.setState({sub_location_list: sub_locations});
            if (sub_locations.length > 0) {
                let first_one = sub_locations[0];
                _this.setState({selected_sub_location: first_one});
                _this.setState({location_image_url : first_one.image_url});
                _this.setState({location_name : first_one.label });
                _this.setState({location_address : first_one.address});
                _this.loadDispenserListBySub(sub_locations[0].value);
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "This main location does not have any sub locations.");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    loadDispenserListBySub(sub_id) {
        let _this = this;
        _this.setState({loading: true});
        let dispensers = [];
        Firebase.firestore().collection('Dispensers').where('Sub_Location_ID', '==', sub_id).get().then(function (response) {
            response.docs.forEach(function (dispenser) {
                let one = {
                    id: dispenser.id,
                    name: dispenser.data().Name,
                    package_id: dispenser.data().Package_ID,
                    created_date: dispenser.data().Created_Date,
                    button_layout_format: dispenser.data().Button_Layout_Format,
                    footer_text: dispenser.data().Footer_Text,
                    enable_print_logo: dispenser.data().Enable_Print_Logo,
                    print_logo_image_url: dispenser.data().Print_Logo_Image_Url,
                    print_type: dispenser.data().Print_Type,
                    show_location_icon: dispenser.data().Show_Location_Icon,
                    height: dispenser.data().Layout_Height,
                    width: dispenser.data().Layout_Width,
                    pin: dispenser.data().Pin
                };

                dispensers.push(one);
            });

            let sorted = dispensers.sort(function (a, b) {
                return a.created_date < b.created_date ? -1 : 1;
            });

            _this.setState({dispenser_list: sorted});
            _this.setState({loading: false});
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    handleAdd() {
        this.props.history.push('/dispenser/add');
    }
    handleRun(id) {
        localStorage.setItem("running_dispenser", id);
        this.props.history.push('/dispenser/run/' + id);
    }
    handleBasicEdit(id) {
        this.props.history.push('/dispenser/basicEdit/' + id);
    }
    handleAdvanceEdit(id) {
        this.props.history.push('/dispenser/advanceEdit/' + id);
    }
    getDispensers() {
        let _this = this;
        return this.state.dispenser_list.map(function (prop, key) {
            return (
                <div key={key}>
                    <Row>
                        <Col md="12">
                            {key===0?<hr/>:''}
                        </Col>
                    </Row>
                    <Row>
                        <Col md="6" sm="6" className="text-center">
                            <img
                                src={printerImage}
                                alt="..."
                            />
                            <h6>{prop.name}</h6>
                        </Col>
                        <Col md="6" sm="6">
                            <Row>
                                <Col md="8" sm="8">
                                    <button className="btn btn-block btn-info" onClick={e => _this.handleRun(prop.id)}>
                                        Run
                                    </button>
                                </Col>
                            </Row>
                            <Row>
                                <Col md="8" sm="8">
                                    <Button
                                        color="warning"
                                        onClick={e => _this.handleBasicEdit(prop.id)}
                                        block
                                    >
                                        Basic Edit
                                    </Button>
                                </Col>
                            </Row>
                            <Row>
                                <Col md="8" sm="8">
                                    <Button
                                        color="danger"
                                        onClick={e => _this.handleAdvanceEdit(prop.id)}
                                        block
                                    >
                                        Advance Edit
                                    </Button>
                                </Col>
                            </Row>
                            <Row>
                                <Col md="8" sm="8" hidden={!(_this.state.role==="Site_Admin" || _this.state.role==="System_Admin")}>
                                    <Button
                                        color="youtube"
                                        onClick={e => _this.warningWithConfirmMessage(prop)}
                                        block
                                    >
                                        Delete
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col md="12">
                            <hr/>
                        </Col>
                    </Row>
                </div>
            );
        });
    }
    onChangeMain(e) {
        this.setState({ selected_main_location : e });
        this.loadSubLocationByMain(e.value);
    }
    onChangeSub(e) {
        this.setState({ selected_sub_location : e });
        this.setState({ location_image_url : e.image_url });
        this.setState({ location_name : e.label });
        this.setState({ location_address : e.address });
        this.loadDispenserListBySub(e.value);
    }
    deleteItem(object) {
        var _this = this;
        _this.setState({loading: true});
        Firebase.firestore().collection('Dispensers').doc(object.id).delete().then(function (res) {
            var storageRef = Firebase.storage().ref();
            var image_name = "dispenser_print_logo_" + object.id;
            if (object.print_logo_image_url !== "") {
                var customerRef = storageRef.child(image_name);
                customerRef.delete().then(function () {
                    _this.setState({loading: false});
                    _this.successDelete();
                }).catch(function (err) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            } else {
                _this.setState({loading: false});
                _this.successDelete();
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network Error.");
        });
    }
    warningWithConfirmMessage = (object) => {
        this.setState({
            alert: (
                <ReactBSAlert
                    warning
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Are you sure?"
                    onConfirm={() => this.deleteItem(object)}
                    onCancel={() => this.hideAlert()}
                    confirmBtnBsStyle="info"
                    cancelBtnBsStyle="danger"
                    confirmBtnText="Yes, delete it!"
                    cancelBtnText="Cancel"
                    showCancel
                >

                </ReactBSAlert>
            )
        });
    };
    successDelete = () => {
        this.setState({
            alert: (
                <ReactBSAlert
                    success
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Deleted!"
                    onConfirm={() => this.confirmDelete()}
                    onCancel={() => this.confirmDelete()}
                    confirmBtnBsStyle="info"
                >

                </ReactBSAlert>
            )
        });
    };
    confirmDelete = () => {
        this.setState({
            alert: null
        });

        this.loadDispenserListBySub(this.state.selected_sub_location.value);
    };
    hideAlert = () => {
        this.setState({
            alert: null
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
                    {this.state.alert}
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Dispensers</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Col className="ml-auto mr-auto" xl="8" lg="12" md="12">
                                        <Row>
                                            <Col xl="4" lg="6" md="6" sm="6">
                                                <Button
                                                    color="success"
                                                    onClick={e => this.handleAdd()}
                                                    block
                                                >
                                                    Add Dispenser
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Form>
                                            <Row>
                                                <Col lg="8" xs="12">
                                                    <FormGroup>
                                                        <Label>Main Location</Label>
                                                        <Select
                                                            className="react-select info select-location"
                                                            classNamePrefix="react-select"
                                                            placeholder="Select Main Location"
                                                            name="selectMainLocation"
                                                            value={this.state.selected_main_location}
                                                            onChange={e =>
                                                                this.onChangeMain(e)
                                                            }
                                                            options={this.state.main_location_list}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col lg="8" xs="12">
                                                    <FormGroup>
                                                        <Label>Sub Location</Label>
                                                        <Select
                                                            className="react-select info select-location"
                                                            classNamePrefix="react-select"
                                                            placeholder="Select Sub Location"
                                                            name="selectSubLocation"
                                                            value={this.state.selected_sub_location}
                                                            onChange={e =>
                                                                this.onChangeSub(e)
                                                            }
                                                            options={this.state.sub_location_list}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </Form>
                                        <Row>
                                            <Col xl="8" lg="12" md="12">
                                                {this.getDispensers()}
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

export default Dispensers;
