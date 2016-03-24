and
===

and for yotoo

$ forever -w server/server.js

* modify for test server
  * server/config.json : port is 80

* before distribution
  * application model public false( certData!!)



## todo
/server/boot/ : Scripts are automatically executed in alphabetical order. so add REST API somthing

/server/model-config.json 과 /common/models/에 있는 JSON 과의 관계는?


## mind..
패스포트에서 브라우져로 로긴하는 건 액세스토큰 생성 안하게 못하나?
providers.json 에서 트위터로긴api는 세선을 false로 하는게 나을것 같은데..


## UserIdentity vs UserCredential
UserIdentity and UserCredential are very similar but they are for different purposes.
UserIdentity keeps associated identities or profiles for a LoopBack user. It will be created if a 3rd party or alternative login is involved. For example, if your app allows a user to log in with Facebook or Google, the UserIdentity may have two entries.
UserCredential keeps associated credentials for a LoopBack user. The credentials don't necessarily represent the LoopBack user itself. For example, a LoopBack user can have credentials for his/her spouse's facebook account. The main purpose of UserCredential is for account linking so that a logged in LoopBack user can potentially use linked credentials for downstream service calls. For example, a LoopBack user to see pictures from FB.
