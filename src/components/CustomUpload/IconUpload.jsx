import React from "react";
// used for making the prop types of this component
import PropTypes from "prop-types";

import { Button } from "reactstrap";

import defaultImage from "../../assets/img/image_placeholder.jpg";
import defaultAvatar from "../../assets/img/placeholder.jpg";

class IconUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      imagePreviewUrl: this.props.avatar ? defaultAvatar : defaultImage
    };
    this.handleImageChange = this.handleImageChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleSetUrl = this.handleSetUrl.bind(this);
  }
  handleSetUrl(e) {
    this.setState({
        imagePreviewUrl: e
    });
  }
  handleImageChange(e) {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    if (file === undefined)
      return;

    reader.onloadend = () => {
      this.setState({
        file: file,
        imagePreviewUrl: reader.result
      });
    };

    reader.readAsDataURL(file);
  }
  handleSubmit(e) {
    e.preventDefault();
    // this.state.file is the file/image uploaded
    // in this function you can save the image (this.state.file) on form submit
    // you have to call it yourself
  }
  handleClick() {
    this.refs.fileInput.click();
  }
  handleRemove() {
    this.setState({
      file: null,
      imagePreviewUrl: this.props.avatar ? defaultAvatar : defaultImage
    });
    this.refs.fileInput.value = null;
  }
  render() {
    return (
      <div className="text-center">
        <input type="file" onChange={this.handleImageChange} ref="fileInput" hidden/>
        <div className="row">
            <div className="col-md-4 full-size">
                <div className={"thumbnail" + (this.props.avatar ? " img-circle" : "") + " full-size"}>
                    <img src={this.state.imagePreviewUrl} alt="..." className="full-size"/>
                </div>
            </div>
            <div className="col-md-8">
                    {this.state.file === null ? (
                        <Button className="btn-sm" onClick={() => this.handleClick()}>
                            {this.props.avatar ? "Add Photo" : "Import Icon"}
                        </Button>
                    ) : (
                        <span>
                          <Button className="btn-sm" onClick={() => this.handleClick()}>
                            Change
                          </Button>
                          <Button
                              color="danger"
                              className="btn-sm"
                              onClick={() => this.handleRemove()}
                          >
                            <i className="fa fa-times" />Remove
                          </Button>
                        </span>
                    )}
            </div>
        </div>
      </div>
    );
  }
}

IconUpload.propTypes = {
  avatar: PropTypes.bool
};

export default IconUpload;
