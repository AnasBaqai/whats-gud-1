const { Schema,model } = require('mongoose');

const relationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  followers: [{ 
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  following: [{ 
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }]
});
relationSchema.index({ 'followers': 1 }); // Index for followers array
relationSchema.index({ 'following': 1 }); // Index for following array
relationSchema.index({ user: 1 })
const RelationModel = model('Relation', relationSchema);

//create a relation
exports.createRelation = (obj)=>RelationModel.create(obj);
// get a relation
exports.findRelation = (query)=>RelationModel.findOne(query);

// update a relation
exports.updateRelation =(query,obj)=> RelationModel.findOneAndUpdate(query, obj, { new: true });

