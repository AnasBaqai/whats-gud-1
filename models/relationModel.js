const { Schema,model } = require('mongoose');

const relationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followers: [{ 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{ 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const RelationModel = model('Relation', relationSchema);

//create a relation
exports.createRelation = (obj)=>RelationModel.create(obj);
// get a relation
exports.findRelation = (query)=>RelationModel.findOne(query);

// update a relation
exports.updateRelation =(query,obj)=> RelationModel.findOneAndUpdate(query, obj, { new: true });

