import os
import json
import tornado.web
from typing import Union
from jupyter_server.utils import url_path_join
from jupyterlab_nextflow.launcher import Launcher
from jupyter_server.base.handlers import APIHandler
from jupyterlab_nextflow.config import JupyterlabNextflowConfig


class LauncherAPIHandler(APIHandler):

    def __init__(self, application, request, launcher, **kwargs):
        super().__init__(application, request, **kwargs)
        self.launcher = launcher


class Workflows(LauncherAPIHandler):

    @tornado.web.authenticated
    def get(self, name: Union[str, None] = None) -> None:
        """Get workflow(s)"""
        if not name:
            self.finish(json.dumps(
                self.launcher.workflows))
            return

        workflow = self.launcher.get_workflow(name)
        self.finish(json.dumps(workflow))


class Logs(LauncherAPIHandler):

    @tornado.web.authenticated
    def get(self, instance_id: str) -> None:
        """Get logs(s)"""
        if instance := self.launcher.get_instance(instance_id):
            logfile = os.path.join(instance['path'], 'nextflow.stdout')

            if not os.path.exists(logfile):
                self.finish(json.dumps({}))
                return

            lines = []
            with open(logfile) as lf:
                lines = lf.readlines()
                lines = [line.rstrip() for line in lines]
                self.finish(json.dumps({'logs': lines}))
            return

        self.finish(json.dumps({}))


class Params(LauncherAPIHandler):

    @tornado.web.authenticated
    def get(self, instance_id: str) -> None:
        """Get params(s)"""
        if instance := self.launcher.get_instance(instance_id):
            params_file = os.path.join(instance['path'], self.launcher.PARAMS)

            if not os.path.exists(params_file):
                self.finish(json.dumps({}))
                return

            with open(params_file, 'r') as pf:
                params = json.load(pf)
                self.finish(json.dumps({'params': params}))
            return
        self.finish(json.dumps({}))


class File(LauncherAPIHandler):

    @tornado.web.authenticated
    def get(self) -> None:
        """Get file"""
        payload = self.get_json_body() or {}

        if path := payload.get('path'):
            self.finish(json.dumps({
                'exists': os.path.isfile(path)}))
            return

        self.finish(json.dumps({}))
        return


class Directory(LauncherAPIHandler):

    @tornado.web.authenticated
    def get(self) -> None:
        """Get directory"""
        payload = self.get_json_body() or {}

        if path := payload.get('path'):
            self.finish(json.dumps({
                'exists': os.path.isdir(path)}))
            return

        self.finish(json.dumps({}))
        return


class Instance(LauncherAPIHandler):

    @tornado.web.authenticated
    def get(self, instance_id: Union[str, None] = None) -> None:
        """Get workflow instance(s)"""
        if instance_id:
            instance = self.launcher.get_instance(instance_id)
            self.finish(json.dumps(instance))
            return
        
        payload = self.get_json_body() or {}
        all_instances = self.launcher.instances

        if instance_ids := payload.get('instances'):
            self.finish(json.dumps({ 
                    k: v for (k,v) in x.items() 
                    if k in instance_ids 
                } for x in all_instances
            ))
            return

        self.finish(json.dumps(all_instances))

    @tornado.web.authenticated
    def post(self) -> None:
        """Create a new instance"""
        payload = self.get_json_body()

        if not payload:
            self.finish(json.dumps({}))
            return
        
        name = payload['workflow']
        params = payload['params']

        created, instance = self.launcher.launch(
            name, params)

        self.finish(json.dumps({
            'created': created, 
            'instance': instance
        }))

    @tornado.web.authenticated
    def delete(self, instance_id: Union[str, None] = None) -> None:
        """Create a new instance"""
        if not instance_id:
            self.finish(json.dumps({'deleted': False}))
            return

        self.launcher.delete_instance(instance_id)
        self.finish(json.dumps({'deleted': True}))


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    jupyterlab_nextflow = "jupyterlab-nextflow"

    # Create the launcher
    config = JupyterlabNextflowConfig(
        config=web_app.settings['config_manager'].config)

    launcher = {'launcher': Launcher(port=config.port)}

    # Workflow get
    workflow_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"workflows/([-A-Za-z0-9]+)")
    workflows_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"workflows/?")

    # Instance crd
    instance_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"instances/([-A-Za-z0-9]+)")
    instances_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"instances/?")

    # Instance extras
    logs_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"logs/([-A-Za-z0-9]+)")
    params_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"params/([-A-Za-z0-9]+)")

    # Filesystem
    file_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"file/?")
    directory_pattern = url_path_join(
        base_url, jupyterlab_nextflow, r"directory/?")

    handlers = [
        (workflow_pattern, Workflows, launcher),
        (workflows_pattern, Workflows, launcher),
        (instance_pattern, Instance, launcher),
        (instances_pattern, Instance, launcher),
        (logs_pattern, Logs, launcher),
        (params_pattern, Params, launcher),
        (file_pattern, File, launcher),
        (directory_pattern, Directory, launcher)
    ]

    web_app.add_handlers(host_pattern, handlers)
