import React from "react";
import Select from "react-select";
import PasswordHash from 'password-hash';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from "react-loading-overlay";
import Switch from "react-bootstrap-switch";
import Firebase from 'firebase';
import config from '../../../config';
import {roles} from "../../../utils/utils"

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardFooter,
  Button,
  FormGroup,
  InputGroup,
  Row,
  Col,
  Input,
  InputGroupAddon,
  InputGroupText,
  Form,
  Collapse,
  Label
} from "reactstrap";

class UserAdd extends React.Component {
  constructor(props) {
      super(props);
      if (!Firebase.apps.length) {
          Firebase.initializeApp(config);
      }

      this.state = {
          loading: false,
          customer_role: '',
          customer_id: '',
          customer_list: [],
          roles: [],
          locations: [],

          name: '',
          email: '',
          designation: '',
          role: '',
          access_locations: [],
          use_status: true,
          otp_status: true,

          openedCollapses: [],

          nameState: '',
          emailState: '',
          customState: '',
          roleState: '',
      };

      this.handleChange = this.handleChange.bind(this);
      this.getLocations = this.getLocations.bind(this);
      this.loadCustomers = this.loadCustomers.bind(this);
      this.loadLocations = this.loadLocations.bind(this);
      this.notifyMessage = this.notifyMessage.bind(this);
  }
  componentWillMount() {
    this.setState({loading: true});
    var customer_role = JSON.parse(localStorage.getItem('auth_info')).role;
    var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
    this.setState({customer_role: customer_role});
    var role_list = [];
    if (customer_role === "Site_Admin") {
        roles.forEach(function (role) {
            if (role.value !== "Site_Admin")
                role_list.push(role);
        });

        this.setState({roles: role_list});
        this.loadCustomers();
    } else {
        roles.forEach(function (role) {
            if (role.value !== "Site_Admin" && role.value !== "System_Admin" && role.value !== "Location_Admin")
                role_list.push(role);
        });

        this.setState({roles: role_list});
        this.setState({customer_id: customer_id});
    }
    this.loadLocations();
  }
  componentDidMount() {
      var customer_role = JSON.parse(localStorage.getItem('auth_info')).role;
      if (customer_role === "Site_Admin") {
        this.loadCustomers();
      }
  }
  loadCustomers() {
      var _this = this;
      var customers = [];
    Firebase.firestore().collection('Web_App_Users').get().then(function (response) {
        response.docs.forEach(function (app_user) {
           if (app_user.data().Role === "System_Admin" || app_user.data().Role === "Location_Admin") {
               Firebase.firestore().collection('Customers').doc(app_user.data().Customer_ID).get().then(function (customer) {
                   if (customer.exists) {
                       var one = {
                           value: customer.id,
                           label: customer.data().Email + " (" + customer.data().Name + ")"
                       }

                       customers.push(one);
                       _this.setState({customer_list: customers});
                   }
               }).catch(function (err) {
                   console.log(err);
               })
           }
        });
    }).catch(function (err) {
        console.log(err);
    });
  }
  loadLocations() {
      var _this = this;
      var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
      var location_list = [];
      Firebase.firestore().collection('Main_Locations').where('Customer_ID', '==', customer_id).get().then(function (locations) {
          locations.docs.forEach(function (location) {
              var one = {
                  name: location.data().Name,
                  sub_locations: []
              };
              Firebase.firestore().collection('Sub_Locations').where('Main_Location_ID', '==', location.id).get().then(function (sub_locations) {
                  sub_locations.docs.forEach(function (sub_location) {
                      var one_sub = {
                        name: sub_location.data().Name,
                        id: sub_location.id
                      };
                      one.sub_locations.push(one_sub);
                  });
                  location_list.push(one);
                  _this.setState({locations: location_list});
                  _this.setState({loading: false});
              }).catch(function (err) {
                  _this.setState({loading: false});
                  _this.notifyMessage("tc", 3, "Network Error.");
              });

          });
          _this.setState({loading: false});
      }).catch(function (err) {
          _this.setState({loading: false});
          _this.notifyMessage("tc", 3, "Network Error.");
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
  handleChange = (event, stateName, type) => {
        switch (type) {
            case "email":
                if (this.verifyEmail(event.target.value)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                    const {name, value} = event.target;
                    this.setState({[name]: value});
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }
                break;
            case "name":
                if (this.verifyLength(event.target.value, 1)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                    const {name, value} = event.target;
                    this.setState({[name]: value});
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }
                break;
            case "location" :
                var access_locations = this.state.access_locations;
                if (event.target.checked === true) {
                    access_locations.push(stateName);
                    this.setState({access_locations: access_locations});
                } else {
                    var index = access_locations.indexOf(stateName);
                    if (index !== -1) access_locations.splice(index, 1);
                    this.setState({access_locations: access_locations});
                }
                break;
            case "role" :
                this.setState({role: event});
                this.setState({ [stateName + "State"]: "has-success" });
                if (event.value === "Site_Admin" || event.value === "System_Admin" || event.value === "Location_Admin") {
                    this.refs.custom.setAttribute('hidden', true);
                    this.setState({customState: 'has-success'});
                } else {
                    if (this.state.customer_role === "Site_Admin") {
                        this.refs.custom.removeAttribute('hidden');
                        this.setState({customState: ''});
                    }
                }
                break;
            case "custom" :
                this.setState({customer_id: event.value});
                this.setState({ [stateName + "State"]: "has-success" });
                break;
            default:
                break;
        }
        // this.setState({ [stateName]: event.target.value });
    };
  verifyEmail = value => {
    var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (emailRex.test(value)) {
        return true;
    }
    return false;
  };
  verifyLength = (value, length) => {
    if (value.length >= length) {
        return true;
    }
    return false;
  };
  handleSave = () => {
      if (this.state.nameState === "") {
          this.setState({ nameState: "has-danger" });
      }
      if (this.state.emailState === "") {
          this.setState({ emailState: "has-danger" });
      }
      if (this.state.roleState === "") {
          this.setState({ roleState: "has-danger" });
      }
      if (this.state.customState === "") {
          this.setState({ customState: "has-danger" });
      }
      if (this.state.customer_role==="Site_Admin") {
          if (this.state.customState !== "has-success")
              return;
      }

      if (!(this.state.nameState === "has-success" && this.state.emailState === "has-success" && this.state.roleState === "has-success")) {
          return;
      }

      var _this = this;
      _this.setState({loading: true});
      if (this.state.nameState === "has-success" && this.state.nameState === "has-success") {
          var now = new Date();
          Firebase.firestore().collection('Customers').get().then(function (res) {
              var last_id = "000000000000";
              var next_id = "000000000001";
              if (res.docs.length > 0) {
                  last_id = res.docs[res.docs.length - 1].id;
                  next_id = ++last_id;
              }

              var customer_id = next_id;

              if(_this.refs.custom.getAttribute('hidden') === null) {
                  customer_id = _this.state.customer_id;
              }

              var password = _this.generatePass(8);
              var otp_code = "";
              if (_this.state.otp_status)
                  otp_code = _this.generateId(6);

              var save_data = {
                  Activated: _this.state.use_status,
                  Accessible_Locations: _this.state.access_locations,
                  Created_Date: now,
                  Customer_ID: customer_id,
                  Designation: _this.state.designation,
                  Last_Activity_Date: "",
                  Last_Updated_Date: now,
                  Last_Updated_User_ID: JSON.parse(localStorage.getItem('auth_info')).customer_id,
                  Name: _this.state.name,
                  OTP_Code: otp_code,
                  OTP_Enabled: _this.state.otp_status,
                  Password: PasswordHash.generate(password),
                  Role: _this.state.role===""?"":_this.state.role.value,
                  Google_Token: "",
                  Facebook_Token: "",
                  token: "",
                  What_Sup: "",
                  Viber: "",
                  Telegram: "",
                  Line: "",
                  Image_Url: "",
                  Notification: false
              };

              Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase()).get().then(function (old) {
                  if (old.exists) {
                      _this.setState({loading: false});
                      _this.notifyMessage("tc", 3, "This email is already exist!");
                  } else {
                      Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase()).set(save_data)
                          .then(function() {
                              if (_this.refs.custom.getAttribute('hidden') === null) {
                                  var cus_data = {
                                      API_Key: "",
                                      Company_Name: "",
                                      Country: "",
                                      Email: _this.state.email.toLowerCase(),
                                      Name: _this.state.name,
                                      Partner_Interest: false,
                                      Phone_Number: "",
                                      Web_Site: "",
                                      Image_Url: ""
                                  };
                                  Firebase.firestore().collection('Customers').doc(customer_id).set(cus_data)
                                      .then(function() {
                                          var message_text = "Congratulation.<br />Your registration is successfully Done.<br />Please check your email for login details.<br/>Your login information:<br/>Username: " + _this.state.email.toLowerCase() + "<br/>Password: " + password;
                                          _this.sendEmail(_this.state.email.toLowerCase(), message_text);
                                          if (otp_code !== "") {
                                              var text = "Your otp code has been set.<br/>" +
                                                  "Otp code : <b>" + otp_code + "</b>";
                                              Firebase.functions().httpsCallable('sendMail')({email: _this.state.email.toLowerCase(), subject: 'New OTP Code', text: text}).then(function(error, result) {
                                                  console.log(error, result);
                                              });
                                          }

                                          _this.setState({loading: false});
                                          _this.notifyMessage("tc", 2, "Add user success!");
                                          window.setTimeout(function() { _this.props.history.push("/users") }, 2000);
                                      })
                                      .catch(function(error) {
                                          _this.setState({loading: false});
                                          _this.notifyMessage("tc", 3, "Add user error!");
                                      });
                              } else {
                                  var message_text = "Congratulation.<br />Your registration is successfully Done.<br />Please check your email for login details.<br/>Your login information:<br/>Username: " + _this.state.email.toLowerCase() + "<br/>Password: " + password;
                                  _this.sendEmail(_this.state.email.toLowerCase(), message_text);
                                  if (otp_code !== "") {
                                      var text = "Your otp code has been set.<br/>" +
                                          "Otp code : <b>" + otp_code + "</b>";
                                      Firebase.functions().httpsCallable('sendMail')({email: _this.state.email.toLowerCase(), subject: 'New OTP Code', text: text}).then(function(error, result) {
                                          console.log(error, result);
                                      });
                                  }
                                  _this.setState({loading: false});
                                  _this.notifyMessage("tc", 2, "Add user success!");
                                  window.setTimeout(function() { _this.props.history.push("/users") }, 2000);
                              }
                          })
                          .catch(function(error) {
                              _this.setState({loading: false});
                              _this.notifyMessage("tc", 3, "Add user error!");
                          });
                  }
              }).catch(function (err) {
                  _this.setState({loading: false});
                  _this.notifyMessage("tc", 3, "Network Error.");
              });
          }).catch(function (err) {
              _this.setState({loading: false});
              _this.notifyMessage("tc", 3, "Network Error.");
          });
      }
  }
  generateId(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  generatePass(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,./<>?:{}[]-=_+)(*&^%$#@!~`';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
  getLocations() {
      return this.state.locations.map((prop, toggle_key) => {
         return (
             <div key={toggle_key}>
                 <a href="#" className="custom-nav"><i className={this.state.openedCollapses.includes(toggle_key)?"nc-icon nc-minimal-up":"nc-icon nc-minimal-down"}/></a>
                 <a
                     aria-expanded={this.state.openedCollapses.includes(
                         toggle_key
                     )}
                     href="#"
                     data-parent="#accordion"
                     data-toggle="collapse"
                     onClick={ e => {e.preventDefault(); this.collapsesToggle(toggle_key);}}
                 >
                     {prop.name}
                 </a>
                 <Collapse
                     role="tabpanel"
                     isOpen={this.state.openedCollapses.includes(
                         toggle_key
                     )}
                 >
                     {prop.sub_locations.map((prop, key) => {
                         return (
                             <Label key={key} className="row custom-nav-left">
                                 <Input
                                     name={prop.id}
                                     type="checkbox"
                                     onChange={e => this.handleChange(e, prop.id, "location")}
                                 />
                                 <span className="form-check-sign" />
                                 {prop.name}
                             </Label>
                         );
                    })}
                 </Collapse>
             </div>
         );
      });
  }
  sendEmail(email, text) {
    Firebase.functions().httpsCallable('sendMail')({email: email, subject: 'Welcome to My App Dev1!', text: text}).then(function(error, result) {
        console.log(error, result);
    });
  }
  render() {
  let {
      // register form
      nameState,
      emailState
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
                  <Card className="full-height-page">
                      <CardHeader>
                        <CardTitle tag="h4">User Add</CardTitle>
                      </CardHeader>
                      <CardHeader>
                      </CardHeader>
                      <CardBody>
                        <Form action="#" method="#">
                          <Col className="ml-auto mr-auto" lg="8">
                              <div className="row">
                                  <div className="col-md-7">
                                      <div className="row">
                                          <div className="col-md-3">
                                              <Button
                                                  color="success"
                                                  onClick={this.handleSave}
                                                  block
                                              >
                                                  Add
                                              </Button>
                                          </div>
                                          <div className="col-md-3">
                                              <Button
                                                  color="youtube"
                                                  onClick={e => this.props.history.push("/users")}
                                                  block
                                              >
                                                  Close
                                              </Button>
                                          </div>
                                          {/*<div className="col-md-4">*/}
                                              {/*<Button*/}
                                                  {/*color="warning"*/}
                                                  {/*href="#"*/}
                                                  {/*block*/}
                                              {/*>*/}
                                                  {/*Reset Password*/}
                                              {/*</Button>*/}
                                          {/*</div>*/}
                                      </div>
                                      <div>
                                          <span>Name</span>
                                          <InputGroup className={`has-label ${nameState}`}>
                                              <InputGroupAddon addonType="prepend">
                                                  <InputGroupText>
                                                      <i className="nc-icon nc-single-02" />
                                                  </InputGroupText>
                                              </InputGroupAddon>
                                              <Input
                                                  placeholder="User Name"
                                                  defaultValue={this.state.name}
                                                  type="text"
                                                  name="name"
                                                  onChange={e => this.handleChange(e, "name", "name")}
                                              />
                                              {this.state.nameState === "has-danger" ? (
                                                  <label className="error">This field is required.</label>
                                              ) : null}
                                          </InputGroup>
                                      </div>
                                      <div>
                                          <span>Email Address</span>
                                          <InputGroup className={`has-label ${emailState}`}>
                                              <InputGroupAddon addonType="prepend">
                                                  <InputGroupText>
                                                      <i className="nc-icon nc-single-02" />
                                                  </InputGroupText>
                                              </InputGroupAddon>
                                              <Input
                                                  placeholder="Email Address"
                                                  defaultValue={this.state.email}
                                                  type="email"
                                                  name="email"
                                                  onChange={e => this.handleChange(e, "email", "email")}
                                              />
                                              {this.state.emailState === "has-danger" ? (
                                                  <label className="error">
                                                      Please enter a valid email address.
                                                  </label>
                                              ) : null}
                                          </InputGroup>
                                      </div>
                                      <div>
                                          <span>Designation</span>
                                          <InputGroup>
                                              <InputGroupAddon addonType="prepend">
                                                  <InputGroupText>
                                                      <i className="nc-icon nc-single-02" />
                                                  </InputGroupText>
                                              </InputGroupAddon>
                                              <Input
                                                  placeholder="Designation"
                                                  defaultValue={this.state.designation}
                                                  type="text"
                                                  name="designation"
                                                  onChange={e =>this.setState({ designation: e.target.value })}
                                              />
                                          </InputGroup>
                                      </div>
                                      <div>
                                          <span>Role</span>
                                          <Select
                                              className="react-select info"
                                              classNamePrefix="react-select"
                                              placeholder="Select Role"
                                              name="role"
                                              defaultValue={this.state.role}
                                              onChange={e =>
                                                  this.handleChange(e, "role", "role")
                                              }
                                              options={
                                                  this.state.roles.map(function (val) {
                                                    return { value: val.value, label: val.name };
                                                  })
                                              }
                                          />
                                          {this.state.roleState === "has-danger" ? (
                                              <label className="error" style={{color: "red"}}>This field is required.</label>
                                          ) : null}
                                      </div>
                                      <div ref="custom" hidden>
                                          <br/>
                                          <span>Customer</span>
                                          <Select
                                              className="react-select info"
                                              classNamePrefix="react-select"
                                              placeholder="Select Customer"
                                              name="customer"
                                              onChange={value =>
                                                  this.handleChange(value, 'custom', 'custom')
                                              }
                                              options={this.state.customer_list}
                                          />
                                          {this.state.customState === "has-danger" ? (
                                              <label className="error" style={{color: "red"}}>This field is required.</label>
                                          ) : null}
                                      </div>
                                      <br/>
                                      <div>
                                          <span>Select Accessible Locations</span>
                                          <div className="blockquote blockquote-primary">
                                              <div
                                                  aria-multiselectable={true}
                                                  className="card-collapse"
                                                  id="accordion"
                                                  role="tablist"
                                              >
                                                  {this.getLocations()}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="col-md-5 text-md-center top-margin-section">
                                      <Row>
                                          <Col md="2">
                                          </Col>
                                          <Col md="4">
                                            <span>User Enabled</span>
                                          </Col>
                                          <Col md="4">
                                              <FormGroup>
                                                  <Switch
                                                      defaultValue={this.state.use_status}
                                                      offColor="success"
                                                      offText=""
                                                      onColor="success"
                                                      onText=""
                                                      onChange={event => this.setState({use_status: event.state.value})}
                                                  />
                                              </FormGroup>
                                          </Col>
                                      </Row>
                                      <Row>
                                          <Col md="2">
                                          </Col>
                                          <Col md="4">
                                              <span>OTP Enabled</span>
                                          </Col>
                                          <Col md="4">
                                              <FormGroup>
                                                  <Switch
                                                      defaultValue={this.state.otp_status}
                                                      offColor="success"
                                                      offText=""
                                                      onColor="success"
                                                      onText=""
                                                      onChange={event => this.setState({otp_status: event.state.value})}
                                                  />
                                              </FormGroup>
                                          </Col>
                                      </Row>
                                  </div>
                              </div>
                          </Col>
                        </Form>
                      </CardBody>
                      <CardFooter>
                      </CardFooter>
                  </Card>
              </Col>
            </Row>
          </LoadingOverlay>
      </>
    );
  }
}

export default UserAdd;