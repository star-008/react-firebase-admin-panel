import React from "react";
import Firebase from 'firebase';
import LoadingOverlay from "react-loading-overlay";
import NotificationAlert from "react-notification-alert";
import Select from "react-select";
import config from '../../../config';
import PictureUpload from "../../../components/CustomUpload/PictureUpload";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Form,
    FormGroup,
    Label,
    Input,
    Button
} from "reactstrap";

class PackageEdit extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            code: '',
            name: '',
            unit: '',
            hosted: false,
            multi_location: 0,
            numbers_counters: 0,
            numbers_services: 0,
            numbers_token_service: 0,
            is_mobile: false,
            customizable_service: false,
            reporting: null,
            reporting_list: [],
            user_no: 0,
            is_customer_feedback: false,
            is_api: false,
            archive: null,
            archive_list: [],
            free_upDatable: false,
            support: null,
            support_list: [],
            monthly_price: 0,
            annual_price: 0,
            is_trail: false,
            trail_days: 0,
            is_manager: false,
            order_sequence: 0,
            category: null,
            category_list: [],
            detail: '',
            image_url: ''
        };

        this.handleSave = this.handleSave.bind(this);
        this.loadPackageData = this.loadPackageData.bind(this);
    }
    componentWillMount() {
        var code = "";
        code = this.props.match.params.id;
        this.setState({code: code});
        if (code !== "")
            this.loadPackageData(code);
    }
    componentDidMount() {

    }
    loadPackageData(code) {
        var _this = this;
        _this.setState({loading: true});
        Firebase.firestore().collection('Packages').doc(code).get().then(function (doc) {
            if (doc.exists) {
                _this.setState({name: doc.data().Name});
                _this.setState({unit: doc.data().Unit});
                _this.setState({hosted: doc.data().Hosted});
                _this.setState({multi_location: parseInt(doc.data().Multi_Location)});
                _this.setState({numbers_counters: parseInt(doc.data().Numbers_Counters)});
                _this.setState({numbers_services: parseInt(doc.data().Numbers_Services)});
                _this.setState({numbers_token_service: parseInt(doc.data().Numbers_Token_Service)});
                _this.setState({is_mobile: doc.data().Is_Mobile});
                _this.setState({customizable_service: doc.data().Customizable_Service});
                _this.setState({reporting: {name:doc.data().Reporting, label:doc.data().Reporting}});
                _this.setState({user_no: parseInt(doc.data().User_No)});
                _this.setState({is_customer_feedback: doc.data().Is_Customer_Feedback});
                _this.setState({is_api: doc.data().Is_Api});
                _this.setState({archive: {name:doc.data().Archive, label:doc.data().Archive}});
                _this.setState({free_upDatable: doc.data().Free_Updatable});
                _this.setState({support: {name:doc.data().Support, label:doc.data().Support}});
                _this.setState({monthly_price: parseInt(doc.data().Monthly_Price)});
                _this.setState({annual_price: parseInt(doc.data().Annual_Price)});
                _this.setState({is_trail: doc.data().Is_Trail});
                _this.setState({trail_days: parseInt(doc.data().Trail_Days)});
                _this.setState({is_guideable: doc.data().Is_Guideable});
                _this.setState({is_manager: doc.data().Is_Manager});
                _this.setState({order_sequence: parseInt(doc.data().Order_Sequence)});
                _this.setState({category: {name:doc.data().Category, label:doc.data().Category}});
                _this.setState({detail: doc.data().Detail});
                _this.setState({image_url: doc.data().Image_Url});
                _this.refs.package_image.handleSetUrl(doc.data().Image_Url);
                _this.loadData();
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    loadData() {
        var _this = this;
        _this.setState({loading: true});
        Firebase.firestore().collection('System_Config').doc('Statistics_and_Reporting').get().then(function (doc) {
            var reports = doc.data().Reporting_Access;
            var report_list = [];
            reports.forEach(function (report) {
                var report_one = {
                    value: report,
                    label: report
                };

                report_list.push(report_one);
            });

            _this.setState({reporting_list: report_list});
            Firebase.firestore().collection('System_Config').doc('Archive_Limits').get().then(function (doc) {
                var archives = doc.data().Archive_Limits;
                var archive_list = [];
                archives.forEach(function (archive) {
                    var archive_one = {
                        value: archive,
                        label: archive
                    };

                    archive_list.push(archive_one);
                });

                _this.setState({archive_list: archive_list});
                Firebase.firestore().collection('System_Config').doc('Package_Support').get().then(function (doc) {
                    var supports = doc.data().Support_Access;
                    var support_list = [];
                    supports.forEach(function (support) {
                        var support_one = {
                            value: support,
                            label: support
                        };

                        support_list.push(support_one);
                    });

                    _this.setState({support_list: support_list});
                    Firebase.firestore().collection('System_Config').doc('Package_Categories').get().then(function (doc) {
                        console.log(doc);
                        var categories = doc.data().Customer_Category;
                        var category_list = [];
                        categories.forEach(function (category) {
                            var category_one = {
                                value: category,
                                label: category
                            };

                            category_list.push(category_one);
                        });

                        _this.setState({category_list: category_list});
                        _this.setState({loading: false});
                    }).catch(function (err) {
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
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    handleSave() {
        var _this = this;
        if (_this.state.code === "") {
            _this.notifyMessage("tc", 3, "Package code is empty!");
        } else {
            _this.setState({loading: true});
            var now = new Date();
            var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
            let file = this.refs.package_image.state.file;
            if (file !== null) {
                var storageRef = Firebase.storage().ref();
                var image_name = "package_image_" + _this.state.code;
                var customerRef = storageRef.child(image_name);
                customerRef.put(file).then(function (snapshot) {
                    customerRef.getDownloadURL().then(function (res) {
                        var add_data = {
                            Name: _this.state.name,
                            Last_Modified_Date: now,
                            Last_Modified_User: customer_id,
                            Unit: _this.state.unit,
                            Hosted: _this.state.hosted,
                            Multi_Location: _this.state.multi_location,
                            Numbers_Counters: _this.state.numbers_counters,
                            Numbers_Services: _this.state.numbers_services,
                            Numbers_Token_Service: _this.state.numbers_token_service,
                            Is_Mobile: _this.state.is_mobile,
                            Customizable_Service: _this.state.customizable_service,
                            Reporting: _this.state.reporting===null?"":_this.state.reporting.label,
                            User_No: _this.state.user_no,
                            Is_Customer_Feedback: _this.state.is_customer_feedback,
                            Is_Api: _this.state.is_api,
                            Archive: _this.state.archive===null?"":_this.state.archive.label,
                            Free_Updatable: _this.state.free_upDatable,
                            Support: _this.state.support===null?"":_this.state.support.label,
                            Monthly_Price: _this.state.monthly_price,
                            Annual_Price: _this.state.annual_price,
                            Is_Trail: _this.state.is_trail,
                            Trail_Days: parseInt(_this.state.trail_days),
                            Is_Guideable: _this.state.is_guideable,
                            Is_Manager: _this.state.is_manager,
                            Order_Sequence: _this.state.order_sequence,
                            Category: _this.state.category===null?"":_this.state.category.label,
                            Detail: _this.state.detail,
                            Image_Url: res
                        };

                        Firebase.firestore().collection('Packages').doc(_this.state.code).update(add_data).then(function () {
                            _this.notifyMessage("tc", 2, "Save package success!");
                            _this.setState({loading: false});
                            window.setTimeout(function() { _this.props.history.push("/packages") }, 2000);
                        }).catch(function (err) {
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
                var add_data = {
                    Name: _this.state.name,
                    Last_Modified_Date: now,
                    Last_Modified_User: customer_id,
                    Unit: _this.state.unit,
                    Hosted: _this.state.hosted,
                    Multi_Location: _this.state.multi_location,
                    Numbers_Counters: _this.state.numbers_counters,
                    Numbers_Services: _this.state.numbers_services,
                    Numbers_Token_Service: _this.state.numbers_token_service,
                    Is_Mobile: _this.state.is_mobile,
                    Customizable_Service: _this.state.customizable_service,
                    Reporting: _this.state.reporting===null?"":_this.state.reporting.label,
                    User_No: _this.state.user_no,
                    Is_Customer_Feedback: _this.state.is_customer_feedback,
                    Is_Api: _this.state.is_api,
                    Archive: _this.state.archive===null?"":_this.state.archive.label,
                    Free_Updatable: _this.state.free_upDatable,
                    Support: _this.state.support===null?"":_this.state.support.label,
                    Monthly_Price: _this.state.monthly_price,
                    Annual_Price: _this.state.annual_price,
                    Is_Trail: _this.state.is_trail,
                    Trail_Days: parseInt(_this.state.trail_days),
                    Is_Guideable: _this.state.is_guideable,
                    Is_Manager: _this.state.is_manager,
                    Order_Sequence: _this.state.order_sequence,
                    Category: _this.state.category===null?"":_this.state.category.label,
                    Detail: _this.state.detail
                };

                Firebase.firestore().collection('Packages').doc(_this.state.code).update(add_data).then(function () {
                    _this.notifyMessage("tc", 2, "Save package success!");
                    _this.setState({loading: false});
                    window.setTimeout(function() { _this.props.history.push("/packages") }, 2000);
                }).catch(function (err) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            }
        }
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
                                    <CardTitle tag="h4">Package Edit</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <div className="row">
                                        <div className="col-md-2"/>
                                        <div className="col-md-8">
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <Button
                                                        color="success"
                                                        onClick={this.handleSave}
                                                        block
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                                <div className="col-md-3">
                                                    <Button
                                                        color="youtube"
                                                        onClick={e => this.props.history.push("/packages")}
                                                        block
                                                    >
                                                        Close
                                                    </Button>
                                                </div>
                                                <div className="col-md-6" />
                                                <div className="col-md-12 account-tab" />
                                                <div className="col-md-10">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Package Code</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Input
                                                                        type="text"
                                                                        defaultValue={this.state.code}
                                                                        disabled
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Label md="4">Package Name</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Input
                                                                        placeholder="PackageName"
                                                                        type="text"
                                                                        defaultValue={this.state.name}
                                                                        onChange={e => {this.setState({name: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Label md="4">Unit</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Input
                                                                        placeholder="Unit"
                                                                        type="text"
                                                                        defaultValue={this.state.unit}
                                                                        onChange={e => {this.setState({unit: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Label sm="4">Cloud hosted</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.hosted?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({hosted: !this.state.hosted})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-2">
                                                    <PictureUpload ref="package_image" />
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Multi Location</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.multi_location}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({multi_location: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Maximum Numbers of Counters per Location</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.numbers_counters}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({numbers_counters: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Numbers of Services per Location</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.numbers_services}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({numbers_services: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Numbers of Tokens Service per day</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.numbers_token_service}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({numbers_token_service: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">Mobile Application</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.is_mobile?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({is_mobile: !this.state.is_mobile})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">Self Service Branding and customization</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.customizable_service?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({customizable_service: !this.state.customizable_service})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Statistics and Standard Reporting</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Select
                                                                        className="react-select info"
                                                                        classNamePrefix="react-select"
                                                                        value={this.state.reporting}
                                                                        onChange={value =>
                                                                            this.setState({ reporting: value })
                                                                        }
                                                                        options={this.state.reporting_list}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">No of Users</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.user_no}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({user_no: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">Customer Feedback Module</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.is_customer_feedback?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({is_customer_feedback: !this.state.is_customer_feedback})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">API's</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.is_api?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({is_api: !this.state.is_api})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Archived for</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Select
                                                                        className="react-select info"
                                                                        classNamePrefix="react-select"
                                                                        value={this.state.archive}
                                                                        onChange={value =>
                                                                            this.setState({ archive: value })
                                                                        }
                                                                        options={this.state.archive_list}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">Free Updates</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.free_upDatable?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({free_upDatable: !this.state.free_upDatable})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Support</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Select
                                                                        className="react-select info"
                                                                        classNamePrefix="react-select"
                                                                        value={this.state.support}
                                                                        onChange={value =>
                                                                            this.setState({ support: value })
                                                                        }
                                                                        options={this.state.support_list}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Monthly Price</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.monthly_price}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({monthly_price: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Annual Price</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.annual_price}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({annual_price: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">Trail Package</Label>
                                                            <Col className="checkbox-radios" sm="2">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.is_trail?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({is_trail: !this.state.is_trail})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                            <Label md="2">Trail Days</Label>
                                                            <Col md="4">
                                                                <FormGroup>
                                                                    <Input
                                                                        disabled={!this.state.is_trail}
                                                                        value={this.state.trail_days}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({trail_days: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">User Guides, Training Documents and Videos</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.is_guideable?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({is_guideable: !this.state.is_guideable})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label sm="4">Designated Account Manager</Label>
                                                            <Col className="checkbox-radios" sm="8">
                                                                <FormGroup check>
                                                                    <Label check>
                                                                        <Input
                                                                            type="checkbox"
                                                                            checked={this.state.is_manager?true:false}
                                                                            onChange={e =>
                                                                            {this.setState({is_manager: !this.state.is_manager})}
                                                                            }
                                                                        />
                                                                        <span className="form-check-sign" />
                                                                        Enabled
                                                                    </Label>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Order Sequence</Label>
                                                            <Col md="3">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.order_sequence}
                                                                        type="number"
                                                                        min={0}
                                                                        onChange={e => {this.setState({order_sequence: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">Package Category</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Select
                                                                        className="react-select info"
                                                                        classNamePrefix="react-select"
                                                                        value={this.state.category}
                                                                        onChange={value =>
                                                                            this.setState({ category: value })
                                                                        }
                                                                        options={this.state.category_list}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>
                                                <div className="col-md-12">
                                                    <Form className="form-horizontal">
                                                        <Row>
                                                            <Label md="4">More Details</Label>
                                                            <Col md="8">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.detail}
                                                                        type="textarea"
                                                                        onChange={e => {this.setState({detail: e.target.value})}}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </div>

                                            </div>
                                        </div>
                                        <div className="col-md-2"/>
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

export default PackageEdit;
