import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Firebase from "firebase";
import NotificationAlert from "react-notification-alert";
import config from "../../../config";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Button,
    Collapse
} from "reactstrap";

class Locations extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            empty_sub: false,
            main_location_count: 0,
            max_main_location_limit: 0,

            locations: [],
            openedCollapses: []
        };

        this.onAddMain = this.onAddMain.bind(this);
    }
    componentWillMount() {
        this.loadLocations();
    }
    loadLocations() {
        let _this = this;
        _this.setState({loading: true});
        let customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
        let location_list = [];
        // ----------- Load Customer Category Data in Customer_Cat_Settings in the System_Config collection ----------- //
        Firebase.firestore().collection('Customers').doc(customer_id).get().then(function (own_customer_info) {
            if (own_customer_info.exists) {
                let customer_category = own_customer_info.data().Customer_Category;
                Firebase.firestore().collection('System_Config').doc('Customer_Cat_Settings').collection(customer_category).get().then(function (response) {
                    if (response.docs.length === 1) {
                        let customer_category_data = response.docs[0].data();
                        _this.setState({max_main_location_limit: customer_category_data.Main_Location_Max_Limit});

                        // ----------- Load Main Location List ----------- //
                        Firebase.firestore().collection('Main_Locations').where('Customer_ID', '==', customer_id).get().then(function (locations) {
                            var i = 0;
                            // ----------- Set main_location_count ----------- //
                            _this.setState({main_location_count: locations.docs.length});
                            locations.docs.forEach(function (location) {
                                var one = {
                                    id: location.id,
                                    name: location.data().Name,
                                    sub_locations: []
                                };
                                var cur_toggle = _this.state.openedCollapses;
                                cur_toggle.push(i);
                                _this.setState({openedCollapses: cur_toggle});
                                i = i + 1;
                                Firebase.firestore().collection('Sub_Locations').where('Main_Location_ID', '==', location.id).get().then(function (sub_locations) {
                                    // ----------- when there is one main_location which doesn't have any sub_location ----------- //
                                    if (sub_locations.docs.length === 0) {
                                        _this.setState({empty_sub: true});
                                    }

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
                    } else {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network Error.");
                    }
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
    getLocations() {
        return this.state.locations.map((prop, toggle_key) => {
            return (
                <div key={toggle_key}>
                    <Row>
                        <Col xl="4" lg="6" className="top-margin-custom overflow-ellipsis">
                            <a href="#" className="custom-nav"><i className={this.state.openedCollapses.includes(toggle_key)?"nc-icon nc-minimal-up":"nc-icon nc-minimal-down"}/></a>
                            <a
                                aria-expanded={this.state.openedCollapses.includes(
                                    toggle_key
                                )}
                                href="#"
                                id={'main-' + toggle_key}
                                data-parent="#accordion"
                                data-toggle="collapse"
                                onClick={ e => {e.preventDefault(); this.collapsesToggle(toggle_key);}}
                            >
                                {prop.name}
                            </a>
                        </Col>
                        <Col xl="2" lg="2" className="padding-custom">
                            <Button
                                onClick={e => {e.preventDefault(); this.onEditMain(prop.id)}}
                                className="btn btn-sm btn-primary"
                                block
                            >
                                Edit
                            </Button>
                        </Col>
                    </Row>
                    <Collapse
                        role="tabpanel"
                        isOpen={this.state.openedCollapses.includes(
                            toggle_key
                        )}
                    >
                        {prop.sub_locations.map((prop, key) => {
                            return (
                                <Row key={key}>
                                    <Col xl="4" lg="6" className="top-margin-custom padding-custom-location overflow-ellipsis">
                                        <span id={'sub-' + toggle_key + '-' + key} onClick={e => e.preventDefault()}>
                                        - {prop.name}
                                        </span>
                                    </Col>
                                    <Col xl="2" lg="2" className="padding-custom">
                                        <Button
                                            onClick={e => {e.preventDefault(); this.onEditSub(prop.id)}}
                                            className="btn btn-sm btn-warning text-capitalize"
                                            block
                                        >
                                            Edit
                                        </Button>
                                    </Col>
                                    <Col xl="2" lg="2" className="padding-custom">
                                        <Button
                                            onClick={e => {e.preventDefault(); this.onUpgradeSub(prop.id)}}
                                            className="btn btn-sm btn-success text-capitalize"
                                            block
                                        >
                                            Upgrade
                                        </Button>
                                    </Col>
                                    <Col xl="2" lg="2" className="padding-custom">
                                        <Button
                                            onClick={e => {e.preventDefault(); this.onDisableSub(prop.id)}}
                                            className="btn btn-sm btn-danger text-capitalize"
                                            block
                                        >
                                            Disable
                                        </Button>
                                    </Col>
                                </Row>
                            );
                        })}
                    </Collapse>
                </div>
            );
        });
    }
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
    onAddMain() {
        if (this.state.empty_sub) {
            this.notifyMessage("tc", 3, "Cannot Create Main Location because there is already a Main location without any sub location.");
            return;
        }

        // --------- Check Max Main Location Limit --------- //
        if (this.state.main_location_count < this.state.max_main_location_limit) {
            this.props.history.push("/main_location/add");
        } else {
            this.notifyMessage("tc", 3, "You have reached the main location max limit.");
        }
    }
    onAddSub() {
        this.props.history.push("/sub_location/add_select_package");
    }
    onEditMain(id) {
        this.props.history.push("/main_location/edit/" + id);
    }
    onEditSub(id) {
        this.props.history.push("/sub_location/edit/" + id);
    }
    onUpgradeSub(id) {
        this.props.history.push("/sub_location/edit_upgrade_package/" + id);
    }
    onDisableSub(id) {
        let _this = this;
        _this.setState({loading: true});
        let now = new Date();
        Firebase.firestore().collection('Sub_Locations').doc(id).update({Stop_Date:now}).then(function () {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 2, "Disable Sub Location Success");
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
                                    <CardTitle tag="h4">Locations</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col className="ml-auto mr-auto" xl="10" lg="12" md="12">
                                            <Row className="bottom-margin-20">
                                                <Col xl="3" lg="4">
                                                    <Button
                                                        onClick={e => {e.preventDefault(); this.onAddMain();}}
                                                        className="btn btn-info"
                                                        id="btnAddMain"
                                                        block
                                                    >
                                                        Add Main Location
                                                    </Button>
                                                </Col>
                                                <Col xl="3" lg="4">
                                                    <Button
                                                        onClick={e => {e.preventDefault(); this.onAddSub()}}
                                                        className="btn btn-info"
                                                        id="btnAddSub"
                                                        block
                                                    >
                                                        Add Sub Location
                                                    </Button>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="12">
                                                    <div className="blockquote">
                                                        <div
                                                            aria-multiselectable={true}
                                                            className="card-collapse col-md-12"
                                                            id="accordion"
                                                            role="tablist"
                                                        >
                                                            {this.getLocations()}
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
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

export default Locations;
