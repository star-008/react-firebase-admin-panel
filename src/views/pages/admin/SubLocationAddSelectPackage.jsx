import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Select from "react-select";
import Firebase from "firebase";
import NotificationAlert from "react-notification-alert";
import config from "../../../config";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    CardFooter,
    Row,
    Button,
    Form,
    FormGroup,
    Label,
    Input
} from "reactstrap";

class SubLocationAddSelectPackage extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            package_list: [],
            pay_rate_type: {
                value: 'Monthly',
                label: 'Monthly'
            },

        };
    }
    componentWillMount() {
        let _this = this;
        _this.setState({loading: true});
        let customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
        let packages = [];
        Firebase.firestore().collection('Customers').doc(customer_id).get().then(function (own_customer_info) {
            if (own_customer_info.exists) {
                Firebase.firestore().collection('Packages').where('Category', '==', own_customer_info.data().Customer_Category).get().then(function (package_list) {
                    package_list.docs.forEach(function (doc) {
                        packages.push({
                            id: doc.id,
                            Name: doc.data().Name,
                            Unit: doc.data().Unit,
                            Multi_Location: doc.data().Multi_Location,
                            Numbers_Counters: doc.data().Numbers_Counters,
                            Numbers_Services: doc.data().Numbers_Services,
                            Numbers_Token_Service: doc.data().Numbers_Token_Service,
                            Is_Mobile: doc.data().Is_Mobile,
                            Customizable_Service: doc.data().Customizable_Service,
                            Reporting: doc.data().Reporting,
                            User_No: doc.data().User_No,
                            Is_Customer_Feedback: doc.data().Is_Customer_Feedback,
                            Is_Api: doc.data().Is_Api,
                            Archive: doc.data().Archive,
                            Free_Updatable: doc.data().Free_Updatable,
                            Support: doc.data().Support,
                            Monthly_Price: doc.data().Monthly_Price,
                            Annual_Price: doc.data().Annual_Price,
                            Is_Trail: doc.data().Is_Trail,
                            Trail_Days: doc.data().Trail_Days,
                            Is_Manager: doc.data().Is_Manager,
                            Order_Sequence: doc.data().Order_Sequence,
                            Image_Url: doc.data().Image_Url,
                        });
                    });

                    _this.setState({package_list: packages});
                    _this.setState({loading: false});
                }).catch(function (err) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network Error.");
                });
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network Error.");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network Error.");
        });
    }
    gotoAdd(package_id) {
        this.props.history.push("/sub_location/add/" + package_id);
    }
    gotoRequestQuotation() {
        this.props.history.push("/sub_location/add_request_quotation");
    }
    getPackages() {
        let _this = this;
        return this.state.package_list.map((prop, toggle_key) => {
            return (
                <Col md="2" key={toggle_key}>
                    <Card className="text-center border-gray height-card">
                        <CardHeader>
                            <CardTitle className="overflow-ellipsis">
                                {prop.Name}
                            </CardTitle>
                        </CardHeader>
                        <CardBody className="border-top-gray">
                            <h6 className="overflow-ellipsis">
                                {_this.state.pay_rate_type.label} / USD {_this.state.pay_rate_type.label === "Monthly"?prop.Monthly_Price:prop.Annual_Price}
                            </h6>
                            <img
                                alt="..."
                                src={prop.Image_Url}
                                className="size-60-fixed"
                            />
                            <p className="top-margin-7 overflow-ellipsis">
                                {prop.Hosted?"Yes":"No"}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Multi_Location}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Numbers_Counters}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Numbers_Services}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Numbers_Token_Service}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Is_Mobile?"Yes":"No"}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Customizable_Service?"Yes":"No"}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Reporting}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.User_No}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Is_Customer_Feedback?"Yes":"No"}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Is_Api?"Yes":"No"}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Archive}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Free_Updatable?"Yes":"No"}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Support}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Trail_Days}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Is_Trail?"Yes":"No"}
                            </p>
                            <p className="overflow-ellipsis">
                                {prop.Is_Manager?"Yes":"No"}
                            </p>
                        </CardBody>
                        <CardFooter>
                            <Button
                                className="text-capitalize btn-success"
                                onClick={e => {e.preventDefault(); this.gotoAdd(prop.id);}}
                                block
                            >
                                Get Started
                            </Button>
                        </CardFooter>
                    </Card>
                </Col>
            );
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
                                    <CardTitle tag="h4">Sub Location Add / Select Package</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col lg="2">
                                            <div>
                                                <Button
                                                    className="btn btn-youtube"
                                                    onClick={e => this.props.history.push("/locations")}
                                                    block
                                                >
                                                    Close
                                                </Button>
                                            </div>
                                        </Col>
                                        <Col lg="2">
                                            <Select
                                                className="react-select info select-location"
                                                classNamePrefix="react-select"
                                                value={this.state.pay_rate_type}
                                                onChange={e =>
                                                    this.setState({pay_rate_type: e})
                                                }
                                                options={[
                                                    {
                                                        value: 'Monthly',
                                                        label: 'Monthly'
                                                    },
                                                    {
                                                        value: 'Yearly',
                                                        label: 'Yearly'
                                                    }
                                                ]}
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4">
                                            <Card className="text-center border-gray height-card">
                                                <CardHeader>
                                                    <CardTitle className="overflow-ellipsis">
                                                        Features
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardBody className="border-top-gray  overflow-ellipsis">
                                                    <p className="top-margin-package-card-1">
                                                        Cloud Hosted
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Multi Location
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Maximum Number Of Counters Per Location
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Number Of Services Per Location
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Number Of Tokens Per Service Per Day
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Mobile Application
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Self Service Branding And Customization
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Statistics And Reporting
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        No Of Users Per Location
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Customer Feedback Module
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        API's
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Archived For
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Free Updates
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Support
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Trail Days
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        User Guides, Training Documents and Videos
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        Designated Account Manager
                                                    </p>
                                                </CardBody>
                                                <CardFooter>
                                                </CardFooter>
                                            </Card>
                                        </Col>
                                        {this.getPackages()}
                                        <Col md="2">
                                            <Card className="text-center border-gray height-card">
                                                <CardHeader>
                                                    <CardTitle className="overflow-ellipsis">
                                                        Custom
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardBody className="border-top-gray overflow-ellipsis">
                                                    <p className="top-margin-package-card-1">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                    <p className="overflow-ellipsis">
                                                        -
                                                    </p>
                                                </CardBody>
                                                <CardFooter>
                                                    <Button
                                                        className="text-capitalize btn-primary"
                                                        block
                                                        onClick={e => {e.preventDefault(); this.gotoRequestQuotation();}}
                                                    >
                                                        Request for Quotation
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </LoadingOverlay>
            </>
        );
    }
}

export default SubLocationAddSelectPackage;
