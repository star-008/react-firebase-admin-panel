import React from "react";
import Firebase from 'firebase';
import PasswordHash from 'password-hash';
import config from '../../../config';

import Select from "react-select";
import Switch from "react-bootstrap-switch";
import PictureUpload from "../../../components/CustomUpload/PictureUpload.jsx";
import NotificationAlert from "react-notification-alert";
// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label
} from "reactstrap";
import LoadingOverlay from "react-loading-overlay";

const { getNameList } = require('country-list');
class AccountSettings extends React.Component {
  constructor(props) {
      super(props);
      if (!Firebase.apps.length) {
          Firebase.initializeApp(config);
      }

      this.state = {
          loading: false,
          hideCustom: true,
          pageTabs: "homePages",
          name: '',
          past_email: '',
          email: '',
          activated: '',
          created_date: '',
          what_sup: '',
          viber: '',
          telegram: '',
          line: '',
          otp_enabled: false,
          password: '',
          oldPass: '',
          newPass: '',
          confirmPass: '',
          oldPassState: '',
          newPassState: '',
          confirmPassState: '',
          profile_image: null,
          notification: false,

          customer_image: null,
          customer_id: '',
          company_name: '',
          web_site: '',
          country: null,
          phone_number: '',
          partner_interest: false,

          country_list: [
              {
                  value: "",
                  label: " Single Options",
                  isDisabled: true
              }
          ]
      };

      this.notifyMessage = this.notifyMessage.bind(this);
      this.setData = this.setData.bind(this);
      this.handleChangePass = this.handleChangePass.bind(this);
      this.handleCustomerSave = this.handleCustomerSave.bind(this);
      this.handleProfileSave = this.handleProfileSave.bind(this);
  }
  componentWillMount() {
      var role = JSON.parse(localStorage.getItem('auth_info')).role;
      if (role === "Site_Admin" || role === "System_Admin" || role === "Location_Admin")
          this.setState({hideCustom: false});

      var array = Object.keys(getNameList());
      var list = this.state.country_list;
      array.forEach(function (item) {
          list.push({value: item, label: item});
      });

      this.setState({country_list: list});
      this.loadData();
  };
  componentDidMount() {
  };
  loadData() {
      var _this = this;
      _this.setState({loading: true});
      var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
      var role = JSON.parse(localStorage.getItem('auth_info')).role;
      var email = JSON.parse(localStorage.getItem('auth_info')).email;
      var custom_info = {};
      var auth = {};

      Firebase.firestore().collection('Web_App_Users').doc(email).get().then(function (app_info) {
          if (app_info.exists) {
              auth['name'] = app_info.data().Name;
              auth['activated'] = app_info.data().Activated;
              auth['email'] = app_info.id;
              auth['created_date'] = app_info.data().Created_Date;
              auth['what_sup'] = app_info.data().What_Sup;
              auth['viber'] = app_info.data().Viber;
              auth['telegram'] = app_info.data().Telegram;
              auth['line'] = app_info.data().Line;
              auth['otp_enabled'] = app_info.data().OTP_Enabled;
              auth['password'] = app_info.data().Password;
              auth['notification'] = app_info.data().Notification;
              auth['image_url'] = app_info.data().Image_Url;
              if (role === "Site_Admin" || role === "System_Admin" || role === "Location_Admin") {
                  Firebase.firestore().collection('Customers').doc(customer_id).get().then(function (customer) {
                      if (customer.exists) {
                          custom_info['customer_id'] = customer.id;
                          custom_info['company_name'] = customer.data().Company_Name;
                          custom_info['country'] = customer.data().Country;
                          custom_info['partner_interest'] = customer.data().Partner_Interest;
                          custom_info['phone_number'] = customer.data().Phone_Number;
                          custom_info['web_site'] = customer.data().Web_Site;
                          custom_info['image_url'] = customer.data().Image_Url;
                          _this.setData(auth, custom_info);
                      } else {
                          _this.setState({loading: false});
                          _this.props.history.push("/login");
                      }
                  }).catch(function (error) {
                      _this.setState({loading: false});
                      _this.notifyMessage("tc", 3, "Network error!");
                  });
              } else {
                _this.setData(auth, null);
              }
          } else {
              _this.setState({loading: false});
              _this.props.history.push("/login");
          }
      }).catch(function (error) {
          _this.setState({loading: false});
          _this.notifyMessage("tc", 3, "Network error!");
      })
  };
  setData(auth, custom_info) {
      this.setState({name: auth.name});
      this.setState({activated: auth.activated});
      this.setState({past_email: auth.email.toLowerCase()});
      this.setState({email: auth.email.toLowerCase()});
      this.setState({created_date: auth.created_date});
      this.setState({what_sup: auth.what_sup});
      this.setState({viber: auth.viber});
      this.setState({telegram: auth.telegram});
      this.setState({line: auth.line});
      this.setState({otp_enabled: auth.otp_enabled});
      this.setState({password: auth.password});
      this.setState({profile_image: auth.image_url});
      this.setState({notification: auth.notification});

      if (custom_info !== null) {
          this.setState({customer_id: custom_info.customer_id});
          this.setState({company_name: custom_info.company_name});
          this.setState({web_site: custom_info.web_site});
          var country = {label:custom_info.country, value:custom_info.country};
          this.setState({country: country});
          this.setState({phone_number: custom_info.phone_number});
          this.setState({partner_interest: custom_info.partner_interest});
          this.setState({customer_image: custom_info.image_url});
          this.refs.customer_image.handleSetUrl(custom_info.image_url);
      }

      this.refs.profile_image.handleSetUrl(auth.image_url);
      this.setState({loading: false});
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
  handleCustomerSave() {
    var _this = this;
    _this.setState({loading: true});
    let file = this.refs.customer_image.state.file;
    if (file !== null) {
        var storageRef = Firebase.storage().ref();
        var image_name = "customer_image_" + this.state.email.toLowerCase();
        var customerRef = storageRef.child(image_name);
        customerRef.put(file).then(function (snapshot) {
            customerRef.getDownloadURL().then(function (res) {
                var update_cus_data = {
                    Company_Name: _this.state.company_name,
                    Country: _this.state.country.value,
                    Email: _this.state.email.toLowerCase(),
                    Name: _this.state.name,
                    Phone_Number: _this.state.phone_number,
                    Web_Site: _this.state.web_site,
                    Partner_Interest: _this.state.partner_interest,
                    Image_Url: res
                };

                Firebase.firestore().collection('Customers').doc(_this.state.customer_id).update(update_cus_data)
                    .then(function() {
                        _this.setState({past_email: _this.state.email.toLowerCase()});
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 2, "Update main account success!");
                        window.setTimeout(function() { _this.props.history.push("/account_settings") }, 2000);
                    }).catch(function (error) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                });
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    } else {
        var update_cus_data = {
            Company_Name: _this.state.company_name,
            Country: _this.state.country.value,
            Email: _this.state.email.toLowerCase(),
            Name: _this.state.name,
            Phone_Number: _this.state.phone_number,
            Web_Site: _this.state.web_site,
            Partner_Interest: _this.state.partner_interest
        };

        Firebase.firestore().collection('Customers').doc(_this.state.customer_id).update(update_cus_data)
            .then(function() {
                _this.setState({past_email: _this.state.email.toLowerCase()});
                _this.setState({loading: false});
                _this.notifyMessage("tc", 2, "Update main account success!");
                window.setTimeout(function() { _this.props.history.push("/account_settings") }, 2000);
            }).catch(function (error) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            });
    }
  };
  handleProfileSave() {
      var _this = this;
      _this.setState({loading: true});
      var now = new Date();
      let file = this.refs.profile_image.state.file;
      if (file !== null) {
          var storageRef = Firebase.storage().ref();
          var image_name = "profile_image_" + this.state.email.toLowerCase();
          var customerRef = storageRef.child(image_name);
          customerRef.put(file).then(function (snapshot) {
              customerRef.getDownloadURL().then(function (res) {
                  var update_app_data = {
                      Last_Updated_Date: now,
                      Last_Updated_User_ID: _this.state.customer_id,
                      Name: _this.state.name,
                      OTP_Enabled: _this.state.otp_enabled,
                      What_Sup: _this.state.what_sup,
                      Viber: _this.state.viber,
                      Telegram: _this.state.telegram,
                      Line: _this.state.line,
                      Notification: _this.state.notification,
                      Image_Url: res
                  };

                  Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).get().then(function (app_info) {
                      if (app_info.exists) {
                          var otp_code = "";
                          if (_this.state.otp_enabled && app_info.data().OTP_Code === "")
                              otp_code = AccountSettings.generateId(6);
                          else if (_this.state.otp_enabled && app_info.data().OTP_Code !== "")
                              otp_code = app_info.data().OTP_Code;

                          update_app_data['OTP_Code'] = otp_code;
                          update_app_data['Activated'] = app_info.data().Activated;
                          update_app_data['Accessible_Locations'] = app_info.data().Accessible_Locations;
                          update_app_data['Created_Date'] = app_info.data().Created_Date;
                          update_app_data['Customer_ID'] = app_info.data().Customer_ID;
                          update_app_data['Designation'] = app_info.data().Designation;
                          update_app_data['Last_Activity_Date'] = app_info.data().Last_Activity_Date;
                          update_app_data['Password'] = app_info.data().Password;
                          update_app_data['Role'] = app_info.data().Role;
                          update_app_data['token'] = app_info.data().token;
                          update_app_data['Google_Token'] = app_info.data().Google_Token;
                          update_app_data['Facebook_Token'] = app_info.data().Facebook_Token;
                          Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).delete().then(function (error) {
                              Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase()).set(update_app_data)
                                  .then(function () {
                                      if (_this.state.otp_enabled && app_info.data().OTP_Code === "") {
                                          var text = "Your otp code has been set.<br/>" +
                                              "Otp code : <b>" + otp_code + "</b>";
                                          Firebase.functions().httpsCallable('sendMail')({email: _this.state.email.toLowerCase(), subject: 'New OTP Code', text: text}).then(function(result) {
                                              console.log(result);
                                          }).catch(function (err) {
                                              _this.setState({loading: false});
                                              _this.notifyMessage("tc", 3, "Network error!");
                                          });
                                      }

                                      _this.notifyMessage("tc", 2, "Update profile success!");
                                      _this.setState({past_email: _this.state.email.toLowerCase()});
                                      window.setTimeout(function () {
                                          _this.props.history.push("/account_settings")
                                      }, 2000);
                                  }).catch(function (err) {
                                      _this.setState({loading: false});
                                      _this.notifyMessage("tc", 3, "NetWork Error.");
                                  });
                          }).catch(function (err) {
                              _this.setState({loading: false});
                              _this.notifyMessage("tc", 3, "NetWork Error.");
                          });
                      } else {
                          _this.setState({loading: false});
                          _this.notifyMessage("tc", 3, "NetWork Error.");
                      }
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
      } else {
          var update_app_data = {
              Last_Updated_Date: now,
              Last_Updated_User_ID: _this.state.customer_id,
              Name: _this.state.name,
              OTP_Enabled: _this.state.otp_enabled,
              What_Sup: _this.state.what_sup,
              Viber: _this.state.viber,
              Telegram: _this.state.telegram,
              Line: _this.state.line,
              Notification: _this.state.notification
          };

          Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).get().then(function (app_info) {
              if (app_info.exists) {
                  var otp_code = "";
                  if (_this.state.otp_enabled && app_info.data().OTP_Code === "")
                      otp_code = AccountSettings.generateId(6);
                  else if (_this.state.otp_enabled && app_info.data().OTP_Code !== "")
                      otp_code = app_info.data().OTP_Code;

                  update_app_data['OTP_Code'] = otp_code;
                  update_app_data['Activated'] = app_info.data().Activated;
                  update_app_data['Accessible_Locations'] = app_info.data().Accessible_Locations;
                  update_app_data['Created_Date'] = app_info.data().Created_Date;
                  update_app_data['Customer_ID'] = app_info.data().Customer_ID;
                  update_app_data['Designation'] = app_info.data().Designation;
                  update_app_data['Last_Activity_Date'] = app_info.data().Last_Activity_Date;
                  update_app_data['Password'] = app_info.data().Password;
                  update_app_data['Role'] = app_info.data().Role;
                  update_app_data['Image_Url'] = app_info.data().Image_Url;
                  update_app_data['token'] = app_info.data().token;
                  update_app_data['Google_Token'] = app_info.data().Google_Token;
                  update_app_data['Facebook_Token'] = app_info.data().Facebook_Token;
                  Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).delete().then(function (error) {
                      Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase()).set(update_app_data)
                          .then(function () {
                              if (_this.state.otp_enabled && app_info.data().OTP_Code === "") {
                                  var text = "Your otp code has been set.<br/>" +
                                      "Otp code : <b>" + otp_code + "</b>";
                                  Firebase.functions().httpsCallable('sendMail')({email: _this.state.email.toLowerCase(), subject: 'New OTP Code', text: text}).then(function(result) {
                                  }).catch(function (err) {
                                      _this.setState({loading: false});
                                      _this.notifyMessage("tc", 3, "Network error!");
                                  });
                              }

                              _this.setState({past_email: _this.state.email.toLowerCase()});
                              _this.setState({loading: false});
                              _this.notifyMessage("tc", 2, "Update profile success!");
                              window.setTimeout(function () {
                                  _this.props.history.push("/account_settings")
                              }, 2000);
                          }).catch(function (err) {
                              _this.setState({loading: false});
                              _this.notifyMessage("tc", 3, "NetWork Error.");
                          });
                  }).catch(function (err) {
                      _this.setState({loading: false});
                      _this.notifyMessage("tc", 3, "NetWork Error.");
                  });
              } else {
                  _this.setState({loading: false});
                  _this.notifyMessage("tc", 3, "Network error!");
              }
          }).catch(function (error) {
              _this.setState({loading: false});
              _this.notifyMessage("tc", 3, "Network error!");
          });
      }
  };
  static getTimeString(time) {
      if (time === null || time === undefined)
          return "";

      if (time.seconds === null)
          return "";

      var date = new Date(time.seconds*1000);
      var time_string = date.toLocaleString();
      return time_string;
  };
  handleChangePass() {
      if (PasswordHash.verify(this.state.oldPass, this.state.password)) {
          this.setState({oldPassState: 'has-success'});
          if ((this.state.newPass !== this.state.confirmPass) || this.state.newPass === "") {
              this.setState({newPassState: 'has-danger'});
              this.setState({confirmPassState: 'has-danger'});
          } else {
              this.setState({newPassState: 'has-success'});
              this.setState({confirmPassState: 'has-success'});
              var _this = this;
              var newPass_hash = PasswordHash.generate(_this.state.newPass);
              var update_data = {
                  Password: newPass_hash
              };
              Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).update(update_data).then(function () {
                  _this.setState({password: newPass_hash});
                  _this.setState({oldPass: ""});
                  _this.setState({newPass: ""});
                  _this.setState({confirmPass: ""});
                  _this.notifyMessage("tc", 2, "Password changed successfully.");
                  window.setTimeout(function() { _this.props.history.push("/account_settings") }, 2000);
              }).catch(function (error) {
                  _this.notifyMessage("tc", 3, "Please confirm email again!");
              });
          }
      } else {
          this.setState({oldPassState: 'has-danger'});
      }
  };
  handleNewPass() {
  };
  static generateId(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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
            <Row>
              <Col md="12">
                  <Card>
                      <CardHeader>
                          <CardTitle tag="h4">Account Settings</CardTitle>
                      </CardHeader>
                      <CardBody>
                      </CardBody>
                  </Card>
                  <Row className="profile-row">
                      <Col md="4" hidden={this.state.hideCustom}>
                          <Card className="card-user">
                              <div className="image">
                                  <img
                                      alt="..."
                                      src={require("../../../assets/img/bg/damir-bosnjak.jpg")}
                                  />
                              </div>
                              <CardBody>
                                  <div className="author">
                                      <PictureUpload ref="customer_image" />
                                  </div>
                                  <div className="row profile-info">
                                      <div className="col-md-4">
                                          <p className="profile-name text-md-center">Registered Date: </p>
                                      </div>
                                      <div className="col-md-8">
                                          <p className="profile-name">{AccountSettings.getTimeString(this.state.created_date)}</p>
                                      </div>
                                  </div>
                                  <div className="row profile-info">
                                      <div className="col-md-4">
                                          <p className="profile-name text-md-center">Status: </p>
                                      </div>
                                      <div className="col-md-8">
                                          <h6 className="profile-name">{this.state.activated?'Activated':'Disabled'}</h6>
                                      </div>
                                  </div>
                                  <div className="row profile-info">
                                      <div className="col-md-4 ">
                                          <p className="profile-name text-md-center">Customer ID: </p>
                                      </div>
                                      <div className="col-md-8">
                                          <p className="profile-name">{this.state.customer_id}</p>
                                      </div>
                                  </div>
                                  <div className="row">
                                      <div className="col-md-12">
                                          <span>Company Name</span>
                                          <InputGroup>
                                              <InputGroupAddon addonType="prepend">
                                                  <InputGroupText>
                                                      <i className="nc-icon nc-bank" />
                                                  </InputGroupText>
                                              </InputGroupAddon>
                                              <Input
                                                  placeholder="CompanyName"
                                                  type="text"
                                                  defaultValue={this.state.company_name}
                                                  onChange={e => {this.setState({company_name: e.target.value})}}
                                              />
                                          </InputGroup>
                                      </div>
                                      <div className="col-md-12">
                                          <span>Web Site</span>
                                          <InputGroup>
                                              <InputGroupAddon addonType="prepend">
                                                  <InputGroupText>
                                                      <i className="nc-icon nc-globe" />
                                                  </InputGroupText>
                                              </InputGroupAddon>
                                              <Input
                                                  placeholder="Web Site"
                                                  type="text"
                                                  defaultValue={this.state.web_site}
                                                  onChange={e => {this.setState({web_site: e.target.value})}}
                                              />
                                          </InputGroup>
                                      </div>
                                      <div className="col-md-12">
                                          <span>Country</span>
                                          <Select
                                              className="react-select info"
                                              classNamePrefix="react-select"
                                              placeholder="Select your country"
                                              name="multipleSelect"
                                              value={this.state.country}
                                              onChange={value =>
                                                  this.setState({ country: value })
                                              }
                                              options={this.state.country_list}
                                          />
                                          <InputGroup>
                                          </InputGroup>
                                      </div>
                                      <div className="col-md-12">
                                          <span>Phone Number</span>
                                          <InputGroup>
                                              <InputGroupAddon addonType="prepend">
                                                  <InputGroupText>
                                                      <i className="nc-icon nc-mobile" />
                                                  </InputGroupText>
                                              </InputGroupAddon>
                                              <Input
                                                  placeholder="Phone Number"
                                                  defaultValue={this.state.phone_number}
                                                  type="text"
                                                  onChange={e => {this.setState({phone_number: e.target.value})}}
                                              />
                                          </InputGroup>
                                      </div>
                                      <div className="col-md-12">
                                          <FormGroup check>
                                              <Label check>
                                                  <Input
                                                      checked={this.state.partner_interest?true:false}
                                                      type="checkbox"
                                                      name="interest"
                                                      onChange={e =>
                                                      {this.setState({partner_interest: !this.state.partner_interest})}
                                                      }
                                                  />
                                                  <span className="form-check-sign" />
                                                  Interested to Become Re seller
                                              </Label>
                                          </FormGroup>
                                      </div>
                                      <div className="col-md-12">
                                          <div className="text-md-center">
                                              <Button
                                                  color="success"
                                                  block
                                                  onClick={this.handleCustomerSave}
                                              >
                                                  Update
                                              </Button>
                                          </div>
                                      </div>
                                  </div>
                              </CardBody>
                              <CardFooter>
                              </CardFooter>
                          </Card>
                      </Col>
                      <Col md={this.state.hideCustom?"12":"8"}>
                          <Card className="card-subcategories">
                              {/* color-classes: "nav-pills-primary", "nav-pills-info", "nav-pills-success", "nav-pills-warning","nav-pills-danger" */}
                              <Nav
                                  className="nav-pills-success"
                              >
                                  <div className="row" style={{width: "100%", margin: "10px"}}>
                                      <div className="col-md-4">
                                          <NavItem className="profile-nav-item" style={{width: "100%"}}>
                                              <NavLink
                                                  data-toggle="tab"
                                                  href="#"
                                                  role="tablist"
                                                  className={
                                                      this.state.pageTabs === "homePages" ? "active" : ""
                                                  }
                                                  onClick={() => this.setState({ pageTabs: "homePages" })}
                                              >
                                                  <i className="now-ui-icons objects_umbrella-13" />
                                                  Edit Profile
                                              </NavLink>
                                          </NavItem>
                                      </div>
                                      <div className="col-md-4">
                                          <NavItem className="profile-nav-item" style={{width: "100%"}}>
                                              <NavLink
                                                  data-toggle="tab"
                                                  href="#"
                                                  role="tablist"
                                                  className={
                                                      this.state.pageTabs === "messagesPages"
                                                          ? "active"
                                                          : ""
                                                  }
                                                  onClick={() =>
                                                      this.setState({ pageTabs: "messagesPages" })
                                                  }
                                              >
                                                  <i className="now-ui-icons shopping_shop" />
                                                  Notifications
                                              </NavLink>
                                          </NavItem>
                                      </div>
                                      <div className="col-md-4">
                                          <NavItem className="profile-nav-item" style={{width: "100%"}}>
                                              <NavLink
                                                  data-toggle="tab"
                                                  href="#"
                                                  role="tablist"
                                                  className={
                                                      this.state.pageTabs === "settingsPages"
                                                          ? "active"
                                                          : ""
                                                  }
                                                  onClick={() =>
                                                      this.setState({ pageTabs: "settingsPages" })
                                                  }
                                              >
                                                  <i className="now-ui-icons ui-2_settings-90" />
                                                  Password
                                              </NavLink>
                                          </NavItem>
                                      </div>
                                  </div>
                              </Nav>
                              <TabContent
                                  className="tab-space tab-subcategories account-tab"
                                  activeTab={this.state.pageTabs}
                              >
                                  <TabPane tabId="homePages">
                                      <div className="row">
                                          <div className="col-md-2">
                                          </div>
                                          <div className="col-md-6" style={{padding: "10px"}}>
                                              <div className="row">
                                                  <div className="col-md-12">
                                                      <span>Name</span>
                                                      <InputGroup>
                                                          <InputGroupAddon addonType="prepend">
                                                              <InputGroupText>
                                                                  <i className="nc-icon nc-single-02" />
                                                              </InputGroupText>
                                                          </InputGroupAddon>
                                                          <Input
                                                              placeholder="UserName"
                                                              type="text"
                                                              defaultValue={this.state.name}
                                                              onChange={e => {this.setState({name: e.target.value})}}
                                                          />
                                                      </InputGroup>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <span>Email Address</span>
                                                      <InputGroup>
                                                          <InputGroupAddon addonType="prepend">
                                                              <InputGroupText>
                                                                  <i className="nc-icon nc-email-85" />
                                                              </InputGroupText>
                                                          </InputGroupAddon>
                                                          <Input
                                                              placeholder="Email Address"
                                                              type="email"
                                                              defaultValue={this.state.email}
                                                              onChange={e => {this.setState({email: e.target.value})}}
                                                          />
                                                      </InputGroup>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <span>Whatsup Number</span>
                                                      <InputGroup>
                                                          <InputGroupAddon addonType="prepend">
                                                              <InputGroupText>
                                                                  <i className="nc-icon nc-mobile" />
                                                              </InputGroupText>
                                                          </InputGroupAddon>
                                                          <Input
                                                              placeholder="Whatsup Number"
                                                              defaultValue={this.state.what_sup}
                                                              type="text"
                                                              onChange={e => {this.setState({what_sup: e.target.value})}}
                                                          />
                                                      </InputGroup>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <span>Viber</span>
                                                      <InputGroup>
                                                          <InputGroupAddon addonType="prepend">
                                                              <InputGroupText>
                                                                  <i className="nc-icon nc-mobile" />
                                                              </InputGroupText>
                                                          </InputGroupAddon>
                                                          <Input
                                                              placeholder="Viber"
                                                              defaultValue={this.state.viber}
                                                              type="text"
                                                              onChange={e => {this.setState({viber: e.target.value})}}
                                                          />
                                                      </InputGroup>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <span>Telegram</span>
                                                      <InputGroup>
                                                          <InputGroupAddon addonType="prepend">
                                                              <InputGroupText>
                                                                  <i className="nc-icon nc-send" />
                                                              </InputGroupText>
                                                          </InputGroupAddon>
                                                          <Input
                                                              placeholder="Telegram"
                                                              defaultValue={this.state.telegram}
                                                              type="text"
                                                              onChange={e => {this.setState({telegram: e.target.value})}}
                                                          />
                                                      </InputGroup>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <span>Line</span>
                                                      <InputGroup>
                                                          <InputGroupAddon addonType="prepend">
                                                              <InputGroupText>
                                                                  <i className="nc-icon nc-chat-33" />
                                                              </InputGroupText>
                                                          </InputGroupAddon>
                                                          <Input
                                                              placeholder="Line"
                                                              defaultValue={this.state.line}
                                                              type="text"
                                                              onChange={e => {this.setState({line: e.target.value})}}
                                                          />
                                                      </InputGroup>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <FormGroup check>
                                                          <Label check>
                                                              <Input
                                                                  checked={this.state.otp_enabled?true:false}
                                                                  type="checkbox"
                                                                  name="interest"
                                                                  onChange={e =>
                                                                    {this.setState({otp_enabled: !this.state.otp_enabled})}
                                                                  }
                                                              />
                                                              <span className="form-check-sign" />
                                                              Enable OTP Login
                                                          </Label>
                                                      </FormGroup>
                                                  </div>
                                                  <div className="col-md-12">
                                                    <div className="text-md-center">
                                                        <Button
                                                          color="success"
                                                          block
                                                          onClick={this.handleProfileSave}
                                                      >
                                                          Update
                                                        </Button>
                                                    </div>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="col-md-3">
                                              <PictureUpload ref="profile_image" />
                                          </div>
                                      </div>
                                  </TabPane>
                                  <TabPane tabId="messagesPages">
                                      <div className="col-md-12 text-md-center">
                                          <p>Email Notification</p>
                                          <Switch
                                              offColor="info"
                                              offText=""
                                              onColor="info"
                                              onText=""
                                              defaultValue={this.state.notification}
                                              value={this.state.notification}
                                              onChange={e => {this.setState({notification: e.state.value})}}
                                          />
                                      </div>
                                  </TabPane>
                                  <TabPane tabId="settingsPages">
                                      <div className="row">
                                          <Col className="ml-auto mr-auto" lg="6">
                                              <Card className="card-plain">
                                                  <CardHeader>
                                                  </CardHeader>
                                                  <CardBody>
                                                      <Form action="#" method="#">
                                                          <label>Old Password</label>
                                                          <FormGroup>
                                                              <Input
                                                                  placeholder="Old Password"
                                                                  type="password"
                                                                  name="oldPass"
                                                                  autoComplete="off"
                                                                  onChange={e => this.setState({ oldPass: e.target.value })}
                                                              />
                                                              {this.state.oldPassState === "has-danger" ? (
                                                                  <label className="error" style={{color: "red"}}>
                                                                      Password is not exact.
                                                                  </label>
                                                              ) : null}
                                                          </FormGroup>
                                                          <label>New Password</label>
                                                          <FormGroup>
                                                              <Input
                                                                  placeholder="New Password"
                                                                  type="password"
                                                                  name="newPass"
                                                                  autoComplete="off"
                                                                  onChange={e => this.setState({ newPass: e.target.value })}
                                                              />
                                                              {this.state.newPassState === "has-danger" ? (
                                                                  <label className="error" style={{color: "red"}}>
                                                                      Please enter the not empty and same values.
                                                                  </label>
                                                              ) : null}
                                                          </FormGroup>
                                                          <label>Retype New Password</label>
                                                          <FormGroup>
                                                              <Input
                                                                  placeholder="Retype New Password"
                                                                  type="password"
                                                                  name="confirmPass"
                                                                  autoComplete="off"
                                                                  onChange={e => this.setState({ confirmPass: e.target.value })}
                                                              />
                                                              {this.state.confirmPassState === "has-danger" ? (
                                                                  <label className="error" style={{color: "red"}}>
                                                                      Please enter the not empty and same values.
                                                                  </label>
                                                              ) : null}
                                                          </FormGroup>
                                                          <div className="row">
                                                              <Col className="col-md-5">
                                                                  <Button
                                                                      color="success"
                                                                      onClick={this.handleChangePass}
                                                                      block
                                                                  >
                                                                      Change
                                                                  </Button>
                                                              </Col>
                                                              <Col className="col-md-7">
                                                                  <Button
                                                                      color="success"
                                                                      onClick={this.handleNewPass}
                                                                      block
                                                                  >
                                                                      Generate New Password
                                                                  </Button>
                                                              </Col>
                                                          </div>
                                                      </Form>
                                                  </CardBody>
                                              </Card>
                                          </Col>
                                      </div>
                                  </TabPane>
                              </TabContent>
                          </Card>
                      </Col>
                  </Row>
              </Col>
            </Row>
        </LoadingOverlay>
      </>
    );
  }
}

export default AccountSettings;
