import React from "react";
import Firebase from 'firebase';
import PasswordHash from 'password-hash';
import config from '../../../config';
import Select from "react-select";
import NotificationAlert from "react-notification-alert";
import ReactTable from "react-table";
import LoadingOverlay from "react-loading-overlay";
import Switch from "react-bootstrap-switch";
import {roles} from "../../../utils/utils"

// reactstrap components
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Button,
    Label,
    FormGroup,
    InputGroup,
    Row,
    Col,
    Input,
    InputGroupAddon,
    InputGroupText,
} from "reactstrap";

var search = "";
class Users extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            role: '',
            checkedItems: [],
            user_data_list: [],
            singleSelect: null,
            selected_customer: '',
            customer_list: [{
                value: '',
                label: 'Show All Customers'
            }],
            sub_locations: []
        };

        this.loadData = this.loadData.bind(this);
        this.getData = this.getData.bind(this);
        this.onChangeStatus = this.onChangeStatus.bind(this);
        this.handleResetPass = this.handleResetPass.bind(this);
        this.onChangeCustom = this.onChangeCustom.bind(this);
    }
    componentWillMount() {
        this.setState({loading: true});
        this.loadData();
    }
    componentDidMount() {
        this.loadData();
    }
    loadData() {
        var _this = this;
        this.setState({user_data_list: []});
        var role = JSON.parse(localStorage.getItem('auth_info')).role;
        var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
        let ref = Firebase.firestore().collection('Web_App_Users');

        if (search !== "") {
            ref = Firebase.firestore().collection('Web_App_Users').where('Customer_ID', '==', search);
        } else if (role === "System_Admin" || role === "Location_Admin") {
            ref = Firebase.firestore().collection('Web_App_Users').where('Customer_ID', '==', customer_id);
        }
        _this.setState({role: role});
        _this.setState({users: []});
        var users = [];
        ref.get().then(function(response) {
            response.docs.forEach(function (doc) {
                if (role === "Site_Admin") {
                    if (doc.get('Role') === "Site_Admin" || (search !== "" && doc.get('Is_Customer'))){
                        return;
                    }
                }

                if (role === "System_Admin") {
                    if (doc.get('Role') === "Site_Admin" || doc.get('Role') === "System_Admin"){
                        return;
                    }
                }

                if (role === "Location_Admin") {
                    if (doc.get('Role') === "Site_Admin" || doc.get('Role') === "System_Admin" || doc.get('Role') === "Location_Admin") {
                        return;
                    }
                }

                users.push({
                    name: doc.get('Name'),
                    email: doc.id,
                    locations: doc.get('Accessible_Locations'),
                    designation: doc.get('Designation'),
                    role: doc.get('Role'),
                    otp_enabled: doc.get('OTP_Enabled'),
                    activated: doc.get('Activated')
                });
                _this.setState({user_data_list: users});
            });

            if (_this.state.role === "Site_Admin")
                _this.loadCustomers();
            else
                _this.setState({loading: false});

        }).catch(function(error) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Can not load data!");
        });
    }
    loadCustomers() {
        var _this = this;
        var customers = [{
            value: '',
            label: 'Show All Customers'
        }];
        Firebase.firestore().collection('Sub_Locations').get().then(function (sub_locations) {
            _this.setState({sub_locations: sub_locations.docs});
        });
        Firebase.firestore().collection('Customers').get().then(function (response) {
            var whole_customers = response.docs;
            whole_customers.forEach(function (item) {
                var one = {
                    value: item.id,
                    label: item.data().Email + " (" + item.data().Name + ")"
                };

                if (one.value !== JSON.parse(localStorage.getItem('auth_info')).customer_id)
                    customers.push(one);
            });

            _this.setState({customer_list: customers});
            _this.setState({loading: false});
        });
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
    }
    getData() {
        var data = [];
        this.state.user_data_list.map((prop, key) => {
            data.push({
                check: (
                    <FormGroup check key={key} style={{marginTop: "-17px"}}>
                        <Label check>
                            <Input type="checkbox" onChange={e => this.onChangeStatus(e, prop, "check")}/>
                            <span className="form-check-sign" />
                        </Label>
                    </FormGroup>
                ),
                id: key+1,
                name: prop.name,
                email: prop.email,
                location: this.getLocations(prop.locations),
                designation: prop.designation,
                role: this.getRole(prop.role),
                enable: (
                    <Switch
                        offColor="success"
                        offText=""
                        onColor="success"
                        onText=""
                        disabled
                        defaultValue={prop.activated}
                        onChange={e => this.onChangeStatus(e, prop.id, "switch")}
                    />
                ),
                edit: (
                    <Button onClick={e => this.props.history.push("/user/edit/" + prop.email)} className="btn btn-warning" style={{marginTop: '-7px', marginBottom: '-7px'}}>Edit</Button>
                )
            });
        });

        return data;
    }
    generatePass(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,./<>?:{}[]-=_+)(*&^%$#@!~`';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    handleResetPass() {
        var _this = this;
        _this.setState({loading: true});
        var checkedItems = _this.state.checkedItems;
        checkedItems.forEach(function (item) {
            var pass =  _this.generatePass(8);
            var email = item.email;
            var message_text = "Your password was changed.<br/>Your new password : <b>" + pass + "<b/>";
            var update_data = {
                Password: PasswordHash.generate(pass)
            };
            Firebase.firestore().collection('Web_App_Users').doc(email).update(update_data).then(function () {
                _this.notifyMessage("tc", 2, "Password reset success!");
                _this.sendEmail(email, "Password Reset", message_text);
                _this.setState({loading: false});
            }).catch(function (err) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network Error.");
            });
        });
    }
    sendEmail(email, subject, text) {
        Firebase.functions().httpsCallable('sendMail')({email: email, subject: subject, text: text}).then(function(error, result) {
            console.log(error, result);
        });
    }
    onChangeStatus(e, value, type) {
        switch (type) {
            case "check":
                var checked = e.target.checked;
                var checkedItems = this.state.checkedItems;
                if (checked) {
                    checkedItems.push(value);
                    this.setState({checkedItems: checkedItems});
                } else {
                    checkedItems.splice(checkedItems.indexOf(value), 1);
                    this.setState({checkedItems: checkedItems});
                }

                break;
            default:
                break;
        }
    }
    getLocations(locations) {
        var result = "";
        var names = this.state.sub_locations;
        for (var i=0; i<locations.length; i++) {
            var same = names.filter(item => item.id === locations[i]);
            if (same.length === 1) {
                result += same[0].get('Name') + " / ";
            }
        }

        result = result.slice(0, result.length-3);

        return result;
    }
    getRole(value) {
        var find = roles.filter(item=>item.value===value);
        if (find.length > 0) {
            return find[0].name;
        } else {
            return "";
        }
    }
    onChangeCustom(e) {
        if (e.value === "") {
            search = "";
        } else {
            search = e.value;
        }

        this.setState({ singleSelect: e });
        this.setState({ selected_customer: e.value });
        this.loadData();
    }
    render() {
        const data = this.getData();
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
                            <Card className="full-height-page">
                                <CardHeader>
                                    <CardTitle tag="h4">Users</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col lg="2">
                                            <div>
                                                <Button onClick={e => this.props.history.push("/user/add")} className="btn btn-success" block>Add User</Button>
                                            </div>
                                        </Col>
                                        <Col lg="2">
                                            <div>
                                                <Button className="btn btn-success" block disabled={this.state.checkedItems.length>0?false:true} onClick={this.handleResetPass}>Reset Password</Button>
                                            </div>
                                        </Col>
                                        <Col lg="3">
                                            <InputGroup className="input-search">
                                                <Input defaultValue="" placeholder="Search" type="text" />
                                                <InputGroupAddon addonType="append">
                                                    <InputGroupText>
                                                        <i className="nc-icon nc-zoom-split" />
                                                    </InputGroupText>
                                                </InputGroupAddon>
                                            </InputGroup>
                                        </Col>
                                        <Col lg="3" hidden={this.state.role === "Site_Admin" ? false : true}>
                                            <Select
                                                className="react-select info select-location"
                                                classNamePrefix="react-select"
                                                placeholder="Select Customer"
                                                name="selectCustomer"
                                                value={this.state.singleSelect}
                                                onChange={e =>
                                                    this.onChangeCustom(e)
                                                }
                                                options={this.state.customer_list}
                                            />
                                        </Col>
                                    </Row>
                                    <div>
                                        <ReactTable
                                            data={data}
                                            columns={[
                                                {
                                                    Header: "#",
                                                    accessor: "check",
                                                    sortable: false,
                                                },
                                                {
                                                    Header: "Id",
                                                    accessor: "id"
                                                },
                                                {
                                                    Header: "FullName",
                                                    accessor: "name"
                                                },
                                                {
                                                    Header: "Designation",
                                                    accessor: "designation"
                                                },
                                                {
                                                    Header: "Email",
                                                    accessor: "email"
                                                },
                                                {
                                                    Header: "Role",
                                                    accessor: "role"
                                                },
                                                {
                                                    Header: "Location",
                                                    accessor: "location"
                                                },
                                                {
                                                    Header: "Enable",
                                                    accessor: "enable",
                                                    sortable: false,
                                                },
                                                {
                                                    Header: "",
                                                    accessor: "edit",
                                                    sortable: false,
                                                }
                                            ]}
                                            defaultPageSize={5}
                                            showPaginationTop={false}
                                            showPaginationBottom={true}
                                            showPageSizeOptions={false}
                                            /*
                                            You can choose between primary-pagination, info-pagination, success-pagination, warning-pagination, danger-pagination or none - which will make the pagination buttons gray
                                            */
                                            className="-striped -highlight primary-pagination"
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </LoadingOverlay>
            </>
        );
    }
}

export default Users;