'use client';

import { useState } from 'react';
import { addProject, toggleProjectStatus, updateProjectName } from '@/app/admin/projects/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Power } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Project {
  id: string;
  name: string;
  is_active: boolean;
}

interface ProjectsListProps {
  projects: Project[];
}

export default function ProjectsList({ projects }: ProjectsListProps) {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Status change confirmation dialog state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusChangeProject, setStatusChangeProject] = useState<Project | null>(null);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('projectName', newProjectName);

    const result = await addProject(formData);
    setIsSubmitting(false);
    if (result.error) {
      setAddError(result.error);
    } else {
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };

  const handleStatusChangeClick = (project: Project) => {
    setStatusChangeProject(project);
    setIsStatusDialogOpen(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusChangeProject) {
      return;
    }

    setToggleError(null);
    setIsStatusChanging(true);
    const result = await toggleProjectStatus(statusChangeProject.id, statusChangeProject.is_active);
    setIsStatusChanging(false);
    if (result.error) {
      setToggleError(result.error);
    } else {
      setIsStatusDialogOpen(false);
      setStatusChangeProject(null);
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingProject) {
      return;
    }
    
    setEditError(null);
    setIsEditing(true);
    const result = await updateProjectName(editingProject.id, editProjectName);
    setIsEditing(false);
    
    if (result.error) {
      setEditError(result.error);
    } else {
      setIsEditDialogOpen(false);
      setEditingProject(null);
      setEditProjectName('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Manage your active and inactive projects</CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingProject(!isAddingProject)}
            variant={isAddingProject ? "outline" : "default"}
            disabled={isSubmitting || isStatusChanging || isEditing}
          >
            {isAddingProject ? (
              "Cancel"
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Project
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{addError}</AlertDescription>
          </Alert>
        )}
        {toggleError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{toggleError}</AlertDescription>
          </Alert>
        )}

        {isAddingProject && (
          <form onSubmit={handleAddProject} className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Saving...</span>
                    <span className="animate-spin">⌛</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Save Project
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={project.is_active ? "default" : "secondary"}>
                      {project.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChangeClick(project)}
                        disabled={isSubmitting || isStatusChanging || isEditing}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {project.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(project)}
                        disabled={isSubmitting || isStatusChanging || isEditing}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Make changes to the project name here. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editError && (
                <Alert variant="destructive">
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="editProjectName">Project Name</Label>
                <Input
                  id="editProjectName"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  placeholder="Enter project name"
                  disabled={isEditing}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={isEditing}
              >
                {isEditing ? (
                  <>
                    <span className="mr-2">Saving...</span>
                    <span className="animate-spin">⌛</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Confirmation Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {statusChangeProject?.is_active ? "Deactivate Project" : "Activate Project"}
              </DialogTitle>
              <DialogDescription>
                {statusChangeProject?.is_active
                  ? "Are you sure you want to deactivate this project? This will hide it from the project selection list."
                  : "Are you sure you want to activate this project? This will make it available in the project selection list."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={isStatusChanging}
              >
                Cancel
              </Button>
              <Button 
                variant={statusChangeProject?.is_active ? "destructive" : "default"}
                onClick={handleStatusChangeConfirm}
                disabled={isStatusChanging}
              >
                {isStatusChanging ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <span className="animate-spin">⌛</span>
                  </>
                ) : (
                  statusChangeProject?.is_active ? "Deactivate" : "Activate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 