import React from "react";
import LoadingOverlay from "react-loading-overlay";
import ReactTable from "react-table";
import NotificationAlert from "react-notification-alert";
import config from '../../../config';
import Firebase from 'firebase';
import ReactBSAlert from "react-bootstrap-sweetalert";

import {
    Button,
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row
} from "reactstrap";


class Packages extends React.Component {
  constructor(props) {
      super(props);
      if (!Firebase.apps.length) {
          Firebase.initializeApp(config);
      }

      this.state = {
          loading: false,
          package_list: [],
          alert: null
      };

      this.gotoAdd = this.gotoAdd.bind(this);
      this.gotoEdit = this.gotoEdit.bind(this);
  }
  componentWillMount() {
    this.loadData();
  }
  loadData() {
    var _this = this;
    _this.setState({loading: true});
    Firebase.firestore().collection('Packages').get().then(function (response) {
      var package_list = [];
      response.docs.forEach(function (doc) {
          var one = {
              code: doc.id,
              name: doc.data().Name,
              price: doc.data().Annual_Price,
              category: doc.data().Category,
              image_url: doc.data().Image_Url
          };
          package_list.push(one);
      });

      _this.setState({package_list: package_list});
      _this.setState({loading: false});
    }).catch(function () {
      _this.setState({loading: false});
      _this.notifyMessage("tc", 3, "Can not load data!");
    });
  }
  deleteItem(object) {
    var _this = this;
    _this.setState({loading: true});
    Firebase.firestore().collection('Packages').doc(object.code).delete().then(function (res) {
        _this.setState({loading: false});
        var storageRef = Firebase.storage().ref();
        var image_name = "package_image_" + object.code;
        if (object.image_url !== "") {
            var customerRef = storageRef.child(image_name);
            customerRef.delete().then(function () {
                _this.successDelete();
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
  getData() {
      var data = [];
      this.state.package_list.map((prop, key) => {
          data.push({
              code: prop.code,
              name: prop.name,
              price: prop.price,
              category: prop.category,
              edit: (
                  <>
                  <Button onClick={e => this.gotoEdit(prop.code)} className="btn btn-primary"
                          style={{marginTop: '-7px', marginBottom: '-7px'}}>Edit</Button>
                  <Button onClick={ e => this.warningWithConfirmMessage(prop)} className="btn btn-danger"
                          style={{marginTop: '-7px', marginBottom: '-7px'}}>Delete</Button>
                  </>
              )
          })
      });

      return data;
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

      this.loadData();
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
  }
  gotoAdd() {
    this.props.history.push("/package/add");
  }
  gotoEdit(code) {
    this.props.history.push("/package/edit/" + code);
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
              {this.state.alert}
              <Row>
                  <Col md="12">
                      <Card className="full-height-page">
                          <CardHeader>
                              <CardTitle tag="h4">Packages</CardTitle>
                          </CardHeader>
                          <CardBody>
                              <Row>
                                  <Col lg="2">
                                      <div>
                                          <Button onClick={this.gotoAdd} className="btn btn-success" block>Add New</Button>
                                      </div>
                                  </Col>
                              </Row>
                              <div>
                                  <ReactTable
                                      data={data}
                                      columns={[
                                          {
                                              Header: "Code",
                                              accessor: "code"
                                          },
                                          {
                                              Header: "Package",
                                              accessor: "name"
                                          },
                                          {
                                              Header: "Price",
                                              accessor: "price"
                                          },
                                          {
                                              Header: "Category",
                                              accessor: "category"
                                          },
                                          {
                                              Header: "#",
                                              accessor: "edit"
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

export default Packages;
