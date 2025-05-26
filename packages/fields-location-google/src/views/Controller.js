import FieldController from '@open-keystone/fields/Controller';

export default class LocationGoogleController extends FieldController {
  getQueryFragment = () => `
    ${this.path} {
       id
       googlePlaceID
       formattedAddress
       lat
       lng
    }
  `;
}
