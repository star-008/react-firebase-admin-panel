import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Select from "react-select";
import ReactDragListView from 'react-drag-listview/lib/index.js';
import NotificationAlert from "react-notification-alert";
import Firebase from 'firebase';
import ReactBSAlert from "react-bootstrap-sweetalert";
import config from '../../../config';

import {
    Button,
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
} from "reactstrap";

class Services extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            selected_main_location: null,
            main_location_list: [],
            selected_sub_location: null,
            sub_location_list: [],

            data: [],
            alert: null
        };
    }
    componentWillMount() {
        this.loadMainLocations();
    }
    loadMainLocations() {
        let _this = this;
        _this.setState({loading: true});
        let main_locations = [];
        var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
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
                sub_locations.push({label: doc.data().Name, value: doc.id, counts: doc.data().Service_Count});
            });

            _this.setState({sub_location_list: sub_locations});
            if (sub_locations.length > 0) {
                _this.setState({selected_sub_location: sub_locations[0]});
                _this.loadServicesBySub(sub_locations[0].value);
            } else {
                _this.setState({loading: false});
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    loadServicesBySub(sub_id) {
        let _this = this;
        _this.setState({loading: true});
        let services = [];
        Firebase.firestore().collection('Services').where('Sub_Location_ID', '==', sub_id).get().then(function (response) {
            response.docs.forEach(function (doc) {
                let one = {
                    id: doc.id,
                    name: doc.data().Name,
                    icon: doc.data().Icon,
                    start_number: doc.data().Start_Number,
                    end_number: doc.data().End_Number,
                    details: doc.data().Details,
                    priority: doc.data().Priority,
                    updated_date: doc.data().Updated_Date
                };
                services.push(one);
            });


            let sorted = services.sort(function(a,b){
                if (a.priority === b.priority) {
                    let x = a.updated_date > b.updated_date? -1:1;
                    return x;
                } else {
                    let x = a.priority < b.priority? -1:1;
                    return x;
                }
            });
            _this.setState({data: sorted});
            _this.setState({loading: false});
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    gotoAdd() {
        this.props.history.push('/service/add');
    }
    onChangeMain(e) {
        this.setState({ selected_main_location : e });
        this.loadSubLocationByMain(e.value);
    }
    onChangeSub(e) {
        this.setState({ selected_sub_location : e });
        this.loadServicesBySub(e.value);
    }
    deleteItem(object) {
        var _this = this;
        _this.setState({loading: true});
        Firebase.firestore().collection('Services').doc(object.id).delete().then(function (res) {
            _this.setState({loading: false});
            var storageRef = Firebase.storage().ref();
            var image_name = "service_icon_" + object.id;
            if (object.icon!== "") {
                var customerRef = storageRef.child(image_name);
                customerRef.delete().then(function () {
                    // ------- Update Service Count -------- //
                    Firebase.firestore().collection('Sub_Locations').doc(_this.state.selected_sub_location.value).update({Service_Count: _this.state.selected_sub_location.counts-1})
                        .then(function () {
                            _this.successDelete();
                        }).catch(function (err) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                }).catch(function (err) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            } else {
                _this.successDelete();
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    getServices() {
        return this.state.data.map((item, index) => {
            return (
                <li key={index} className="account-tab">
                    <hr/>
                    <Row>
                        <Col md="1">
                            <img
                                alt="..."
                                src={item.icon}
                                className="full-size"
                            />
                        </Col>
                        <Col md="4">
                            <div className="left-margin-10">
                                <a>{item.name}</a>
                                <br/>
                                <small>{item.details}</small>
                            </div>
                        </Col>
                        <Col md="4" className="text-center">
                            <div className="left-margin-10 top-margin-10">
                                <a>Starting Number : </a>
                                <span>{item.start_number}</span>
                                <br/>
                                <hr/>
                                <a>Ending Number : </a>
                                <span>{item.end_number}</span>
                            </div>
                        </Col>
                        <Col md="2" className="text-center">
                            <div className="top-margin-12"/>
                            <Button
                                className="btn btn-warning"
                                onClick={e => this.props.history.push("/service/edit/" + item.id)}
                            >
                                Edit
                            </Button>
                            <Button
                                className="btn btn-danger"
                                onClick={e => { e.preventDefault(); this.warningWithConfirmMessage(item)}}
                            >
                                Delete
                            </Button>
                        </Col>
                        <Col md="1">
                            <a href="#" className="float-right navbar-toggler" onClick={e => e.preventDefault()}><i className="nc-icon nc-align-center"></i></a>
                        </Col>
                    </Row>
                    <hr/>
                </li>
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

        this.loadServicesBySub(this.state.selected_sub_location.value);
    };
    hideAlert = () => {
        this.setState({
            alert: null
        });
    };
    render() {
        const that = this;
        const now = new Date();
        const dragProps = {
            onDragEnd(fromIndex, toIndex) {
                if (fromIndex === -1 || toIndex === -1)
                    return;

                const { data } = that.state;
                const to_priority = data[toIndex].priority;
                const item = data.splice(fromIndex, 1)[0];
                data.splice(toIndex, 0, item);
                data[toIndex].priority = to_priority;
                that.setState({loading: true});
                Firebase.firestore().collection('Services').doc(data[toIndex].id).update({Priority: data[toIndex].priority, Updated_Date: now}).then(function () {
                    that.setState({loading: false});
                }).catch(function (err) {
                    that.setState({loading: false});
                    that.notifyMessage("tc", 3, "Network error!");
                });
                // // -------- Update priority -------- //
                // let start = fromIndex>toIndex?toIndex:fromIndex;
                // let end = fromIndex>toIndex?fromIndex:toIndex;
                // if (start === 0)
                //     data[start].priority = 1;
                // else
                //     data[start].priority = data[start-1].priority + 1;
                // for (let i=start+1; i<=end; i++) {
                //     data[i].priority = data[i].priority + 1;
                // }
                // // Store to database //
                // for (let j=start; j<=end; j++) {
                //     that.setState({loading: true});
                //     Firebase.firestore().collection('Services').doc(data[j].id).update({Priority: data[j].priority}).then(function () {
                //         that.setState({loading: false});
                //     }).catch(function (err) {
                //         that.setState({loading: false});
                //         that.notifyMessage("tc", 3, "Network error!");
                //     });
                // }
                that.setState({data: data});
            },
            nodeSelector: 'li',
            handleSelector: 'a'
        };
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
                                    <CardTitle tag="h4">Services</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col lg="2">
                                            <div>
                                                <Button
                                                    className="btn btn-success"
                                                    onClick={e => {e.preventDefault(); this.gotoAdd();}}
                                                    block
                                                >
                                                    Add New
                                                </Button>
                                            </div>
                                        </Col>
                                        <Col lg="3">
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
                                        </Col>
                                        <Col lg="3">
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
                                        </Col>
                                    </Row>
                                    <Row className="top-margin-10"/>
                                    <div className="simple-inner">
                                        <ReactDragListView {...dragProps}>
                                            <ul style={{ listStyleType:"none" }}>
                                                {this.getServices()}
                                            </ul>
                                        </ReactDragListView>
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

export default Services;
